package com.learningplatform.backend.common.exception;

public class PostLimitException extends RuntimeException {

    public PostLimitException() {
        super("Post limit reached");
    }
}
