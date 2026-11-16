package com.hotelservice.HotelService.repositries;

import com.hotelservice.HotelService.entities.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HotelRepository extends JpaRepository <Hotel, String> {

}
