package com.example.ApiGateway.controllers;

import com.example.ApiGateway.model.AuthResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger =
            LoggerFactory.getLogger(AuthController.class);

    @GetMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RegisteredOAuth2AuthorizedClient("okta")
            OAuth2AuthorizedClient client,

            @AuthenticationPrincipal OidcUser user) {

        logger.info("User email ID: {}", user.getEmail());

        AuthResponse authResponse = new AuthResponse();

        // User information
        authResponse.setUserId(user.getEmail());

        // Access token
        authResponse.setAccessToken(
                client.getAccessToken().getTokenValue()
        );

        // Refresh token (may be null)
        if (client.getRefreshToken() != null) {
            authResponse.setRefreshToken(
                    client.getRefreshToken().getTokenValue()
            );
        }

        // Access token expiration
        if (client.getAccessToken().getExpiresAt() != null) {
            authResponse.setExpireAt(
                    client.getAccessToken()
                            .getExpiresAt()
                            .getEpochSecond()
            );
        }

        // User authorities
        List<String> authorities = user.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        authResponse.setAuthorities(authorities);

        return ResponseEntity.ok(authResponse);
    }
}