package com.userservice.userService.repositories;

import com.userservice.userService.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String > {

}
