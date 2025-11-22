package com.codearena.problemservice.config;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Problem Service API",
                version = "1.0",
                description = "API documentation for CodeArena Problem Service",
                contact = @Contact(
                        name = "CodeArena Dev",
                        email = "support@codearena.com"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "Local Server")
        }
)
public class OpenApiConfig {
}
