package com.learningplatform.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "jwt.secret=dGVzdC1qd3Qtc2VjcmV0LWtleS1mb3ItYXBwbGljYXRpb24tY29udGV4dA=="
})
class LearningPlatformBackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
