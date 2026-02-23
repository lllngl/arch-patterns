package com.internetbank.common;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.internetbank.security.clients")
public class CommonModuleApplication {

	public static void main(String[] args) {
		SpringApplication.run(CommonModuleApplication.class, args);
	}

}
