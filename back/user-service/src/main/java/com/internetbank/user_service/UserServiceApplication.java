package com.internetbank.user_service;

import com.internetbank.common.security.CustomAuthFilter;
import com.internetbank.common.security.JwtService;
import com.internetbank.common.security.SecurityConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.internetbank")
@EnableScheduling
@EnableJpaAuditing
@EnableFeignClients(basePackages = "com.internetbank.common.clients")
@Import({SecurityConfig.class, CustomAuthFilter.class, JwtService.class})
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

}
