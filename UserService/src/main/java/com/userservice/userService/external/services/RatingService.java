package com.userservice.userService.external.services;

import com.userservice.userService.entities.Rating;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "RATING-SERVICE")
public interface RatingService {

    @GetMapping("/ratings/user/{userId}")
    List<Rating> getRatingsByUserId(@PathVariable("userId") String userId);
}
