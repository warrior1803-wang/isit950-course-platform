package com.learningplatform.lms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication
public class LearningPlatformBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(LearningPlatformBackendApplication.class, args);
    }

}
