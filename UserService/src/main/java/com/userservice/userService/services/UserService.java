package com.userservice.userService.services;

import com.userservice.userService.entities.User;

import java.util.List;

public interface UserService {

    User createUser(User user);
    List<User> getAllUser();
    User getUser(String userId);
}
