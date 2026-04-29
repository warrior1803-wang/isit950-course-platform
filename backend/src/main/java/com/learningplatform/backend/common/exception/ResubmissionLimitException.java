package com.learningplatform.backend.common.exception;

public class ResubmissionLimitException extends RuntimeException {

    public ResubmissionLimitException() {
        super("Resubmission limit reached");
    }
}