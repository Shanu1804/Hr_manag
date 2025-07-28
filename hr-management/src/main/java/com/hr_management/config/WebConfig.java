package com.hr_management.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebConfig.class);

    //@Override
    //public void addCorsMappings(CorsRegistry registry) {
      //  logger.info("Configuring CORS for /api/**");
        //registry.addMapping("/api/**")
            //    .allowedOrigins("http://localhost:5173")
          //      .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
              //  .allowedHeaders("*")
                //.allowCredentials(true);
    //}
    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        logger.info("Configuring Jackson message converter");
        for (HttpMessageConverter<?> converter : converters) {
            if (converter instanceof MappingJackson2HttpMessageConverter) {
                MappingJackson2HttpMessageConverter jsonConverter = (MappingJackson2HttpMessageConverter) converter;
                jsonConverter.setSupportedMediaTypes(Arrays.asList(
                        MediaType.APPLICATION_JSON,
                        new MediaType("application", "json", StandardCharsets.UTF_8)
                ));
                logger.debug("Updated supported media types: {}", jsonConverter.getSupportedMediaTypes());
                break;
            }
        }
    }
}