package com.internetbank.config;

import feign.Logger;
import feign.Request;
import feign.Retryer;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class FeignConfig {

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    @Bean
    public Request.Options options() {
        return new Request.Options();
    }

    @Bean
    public Retryer retryer() {
        return new Retryer.Default(
                100,
                TimeUnit.SECONDS.toMillis(1),
                2
        );
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return new FeignErrorDecoder();
    }

    public static class FeignErrorDecoder implements ErrorDecoder {
        private final ErrorDecoder defaultErrorDecoder = new Default();

        @Override
        public Exception decode(String methodKey, feign.Response response) {
            if (response.status() >= 400 && response.status() <= 499) {
                return new RuntimeException("Client error: " + response.status());
            }
            if (response.status() >= 500 && response.status() <= 599) {
                return new RuntimeException("Server error: " + response.status());
            }
            return defaultErrorDecoder.decode(methodKey, response);
        }
    }
}