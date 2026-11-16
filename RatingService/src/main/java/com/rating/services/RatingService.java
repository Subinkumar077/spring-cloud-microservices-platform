package com.rating.services;

import com.rating.entities.Rating;
import org.springframework.stereotype.Service;

import java.util.List;

public interface RatingService {

    List<Rating> getAllRatings();

    List<Rating> getRatingByUserId(String userId);

    List<Rating> getRatingByHotelId(String hotelId);

    Rating create(Rating rating);
}
