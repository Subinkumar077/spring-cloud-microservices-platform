package com.hotelservice.HotelService.impl;

import com.hotelservice.HotelService.entities.Hotel;
import com.hotelservice.HotelService.repositries.HotelRepository;
import com.hotelservice.HotelService.services.HotelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class HotelServiceImpl implements HotelService {

    @Autowired
    private HotelRepository hotelRepository;

    @Override
    public Hotel create(Hotel hotel) {
        String randomUserId = UUID.randomUUID().toString();
        hotel.setId(randomUserId);
        return hotelRepository.save(hotel);
    }

    @Override
    public List<Hotel> getAll() {
        return hotelRepository.findAll();
    }

    @Override
    public Hotel getHotel(String id) {
        return hotelRepository.findById(id).orElseThrow(()-> new RuntimeException("User with given id is not found on server !! : " + id));
    }
}
