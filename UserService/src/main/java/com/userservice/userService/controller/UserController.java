package com.userservice.userService.controller;

import com.userservice.userService.entities.User;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.userservice.userService.services.UserService;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;


    @PostMapping("")
    public ResponseEntity<User> createUser(@RequestBody User user){
        return ResponseEntity.ok(userService.createUser(user));
    }

    @GetMapping("/getalluser")
    public ResponseEntity<List<User>> getAllUser(){
        return ResponseEntity.ok(userService.getAllUser());
    }

//    @GetMapping("/{userId}")
////    @CircuitBreaker(name = "userService", fallbackMethod = "getUserFallback")
//    @RateLimiter(name = "userRateLimiter", fallbackMethod = "getUserFallback")
////    @Retry(name="ratingHotelService", fallbackMethod = "getUserFallback")
//    public ResponseEntity<User> getUser(@PathVariable String userId){
//        return ResponseEntity.ok(userService.getUser(userId));
//    }
//    int retryCount = 1;
//    public ResponseEntity<String> getUserFallback(String userId, Throwable ex) {
////        logger.info("Retry count: {}", retryCount);
//
//        return ResponseEntity
//                .status(HttpStatus.SERVICE_UNAVAILABLE)
//                .body("User service is temporarily unavailable. Please try again later.");
//


@GetMapping("/{userId}")
@RateLimiter(
        name = "userRateLimiter",
        fallbackMethod = "getUserFallback"
)
public ResponseEntity<?> getUser(@PathVariable String userId) {

    return ResponseEntity.ok(userService.getUser(userId));
}

    public ResponseEntity<?> getUserFallback(
            String userId,
            Throwable ex
    ) {

        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .body("Too many requests. Please try again after 4 seconds.");
    }

}
