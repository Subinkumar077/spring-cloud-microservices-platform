
package com.rating.controller;

import com.rating.entities.Rating;
import com.rating.services.RatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;

    // Create Rating
    @PostMapping
    public ResponseEntity<Rating> create(@RequestBody Rating rating) {
        return ResponseEntity.ok(ratingService.create(rating));
    }

    // Get All Ratings
    @GetMapping("/getallratings")
    public ResponseEntity<List<Rating>> getAllRatings() {
        return ResponseEntity.ok(ratingService.getAllRatings());
    }

    // Get Ratings By UserId
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Rating>> getRatingByUserId(
            @PathVariable String userId) {

        return ResponseEntity.ok(
                ratingService.getRatingByUserId(userId)
        );
    }

    // Get Ratings By HotelId
    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<Rating>> getRatingByHotelId(
            @PathVariable String hotelId) {

        return ResponseEntity.ok(
                ratingService.getRatingByHotelId(hotelId)
        );
    }
}
