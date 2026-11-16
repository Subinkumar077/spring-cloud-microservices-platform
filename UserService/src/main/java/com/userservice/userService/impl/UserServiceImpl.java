package com.userservice.userService.impl;

import com.userservice.userService.entities.Hotel;
import com.userservice.userService.entities.Rating;
import com.userservice.userService.entities.User;
import com.userservice.userService.exception.ResourceNotFoundException;
import com.userservice.userService.external.services.HotelService;
import com.userservice.userService.external.services.RatingService;
import com.userservice.userService.repositories.UserRepository;
import com.userservice.userService.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HotelService hotelService;

    @Autowired
    private RatingService ratingService;

    @Override
    public User createUser(User user) {
        String randomUserId = UUID.randomUUID().toString();
        user.setUserId(randomUserId);
        return userRepository.save(user);
    }

    @Override
    public List<User> getAllUser() {
        return userRepository.findAll();
    }

    @Override
    public User getUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User with given id is not found on server !! : " + userId));

        List<Rating> ratingList = ratingService.getRatingsByUserId(userId).stream()
                .map(rating -> {
                    Hotel hotel = hotelService.getHotel(rating.getHotelId());
                    rating.setHotel(hotel);
                    return rating;
                })
                .collect(Collectors.toList());
        user.setRatings(ratingList);

        return user;
    }
}
