package com.edulytix.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * HTTP client configuration.
 * Uses RestTemplate with long timeouts for the AI service calls.
 */
@Configuration
public class WebClientConfig {

    @Bean
    public RestTemplate aiRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30_000);        // 30 seconds
        factory.setReadTimeout(600_000);          // 10 minutes
        return new RestTemplate(factory);
    }

    @Bean
    public WebClient aiWebClient() {
        return WebClient.builder().build();
    }
}