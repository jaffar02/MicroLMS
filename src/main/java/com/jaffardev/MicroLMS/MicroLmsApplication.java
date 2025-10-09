package com.jaffardev.MicroLMS;

import com.jaffardev.MicroLMS.model.Role;
import com.jaffardev.MicroLMS.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
@RequiredArgsConstructor
@EnableAsync
public class MicroLmsApplication implements CommandLineRunner {

	private final RoleRepository roleRepository; // inject repository

	public static void main(String[] args) {
		SpringApplication.run(MicroLmsApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		// Seed roles if they don't exist
		if(roleRepository.count() == 0) {
			roleRepository.save(Role.builder().name("TEACHER").build());
			roleRepository.save(Role.builder().name("STUDENT").build());
			roleRepository.save(Role.builder().name("ADMIN").build());
		}
		System.out.println("Roles initialized.");


	}

}
