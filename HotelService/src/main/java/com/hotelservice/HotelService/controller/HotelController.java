package com.hotelservice.HotelService.controller;

import com.hotelservice.HotelService.entities.Hotel;
import com.hotelservice.HotelService.repositries.HotelRepository;
import com.hotelservice.HotelService.services.HotelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hotels")
public class HotelController {

    @Autowired
    private HotelService hotelService;

    @PostMapping
    public ResponseEntity<Hotel> create(@RequestBody Hotel hotel){
        return ResponseEntity.ok(hotelService.create(hotel));
    }

    @GetMapping("")
    public ResponseEntity<List<Hotel>> getAll(){
        return ResponseEntity.ok(hotelService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hotel> getHotel(@PathVariable String id){
        return ResponseEntity.ok(hotelService.getHotel(id));
    }

}
