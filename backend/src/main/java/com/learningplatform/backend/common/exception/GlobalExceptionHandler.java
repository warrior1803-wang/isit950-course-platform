package com.learningplatform.backend.common.exception;

import com.learningplatform.backend.common.response.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Centralises exception-to-response mapping for the REST API.
 *
 * <p>The backend exposes many role-protected workflows, such as assignment grading,
 * course management, membership limits, and authentication. Keeping exception handling
 * in one place prevents each controller from building its own error response and helps
 * the frontend rely on a consistent {@link ApiResponse} error structure.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Converts expected business rule failures into HTTP 400 responses.
     *
     * <p>These errors usually mean the request was syntactically valid, but violated a
     * domain rule, such as exceeding an assignment score limit or submitting invalid
     * workflow data.</p>
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<?>> handleBusinessException(BusinessException ex) {
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Returns HTTP 403 when Spring Security rejects an authenticated user.
     *
     * <p>This typically happens when a student accesses an instructor-only endpoint,
     * or an authenticated user attempts an action outside their assigned role.</p>
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Forbidden"));
    }

    /**
     * Handles unexpected failures without exposing internal stack traces to the client.
     *
     * <p>The exception is logged for backend diagnosis, while the API response remains
     * intentionally generic so implementation details are not leaked to the frontend.</p>
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleException(Exception ex) {
        logger.error("Unhandled backend exception", ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal server error"));
    }

    /**
     * Uses HTTP 409 for duplicate or conflicting resource states.
     *
     * <p>Conflict responses are useful when the request is valid but cannot be completed
     * because it clashes with existing data, such as a duplicated course code or email.</p>
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<?>> handleConflictException(ConflictException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Converts unreadable request bodies into HTTP 400 responses.
     *
     * <p>This covers malformed JSON and invalid enum values before the request reaches
     * service logic. Returning 400 makes it clear that the client payload must be fixed.</p>
     */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<?>> handleEnumError() {
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error("Request body is missing or invalid"));
    }

    /**
     * Returns HTTP 401 for authentication failures.
     *
     * <p>Unlike 403, this response means the user has not provided a valid identity,
     * usually because the JWT is missing, invalid, or expired.</p>
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<?>> handleUnauthorizedException(UnauthorizedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Reports bean validation failures as HTTP 400.
     *
     * <p>Only the first field-level message is returned to keep the API response simple
     * for the current frontend forms. The validation annotations still remain close to
     * the DTO fields, where the input contract is easiest to understand.</p>
     */
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(
            org.springframework.web.bind.MethodArgumentNotValidException ex
    ) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Validation failed");

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message));
    }

    /**
     * Maps missing domain resources to HTTP 404.
     *
     * <p>This is used when a requested course, assignment, submission, or other resource
     * cannot be found in the database.</p>
     */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFoundException(NotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Returns HTTP 405 when the URL exists but the HTTP method is not supported.
     *
     * <p>This helps distinguish routing mistakes from missing resources, especially when
     * testing REST endpoints through Postman.</p>
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error(ex.getMessage()));
    }
}