mysqldump: [Warning] Using a password on the command line interface can be insecure.
mysqldump: Error: 'Access denied; you need (at least one of) the PROCESS privilege(s) for this operation' when trying to dump tablespaces
-- MySQL dump 10.13  Distrib 8.0.43, for Linux (aarch64)
--
-- Host: localhost    Database: jaidee_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `action_plans`
--

DROP TABLE IF EXISTS `action_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `action_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `plan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  CONSTRAINT `action_plans_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `action_plans`
--

LOCK TABLES `action_plans` WRITE;
/*!40000 ALTER TABLE `action_plans` DISABLE KEYS */;
INSERT INTO `action_plans` VALUES (1,1,'ลดหนี้','2025-10-10 02:45:18'),(2,1,'เพิ่มรายได้','2025-10-10 02:45:18'),(3,1,'หาผู้ค้ำประกัน','2025-10-10 02:45:18'),(4,2,'ลดหนี้','2025-10-10 02:50:25'),(5,2,'เพิ่มรายได้','2025-10-10 02:50:25'),(6,2,'หาผู้ค้ำประกัน','2025-10-10 02:50:25'),(7,3,'ลดหนี้','2025-10-10 07:55:50'),(8,3,'เพิ่มรายได้','2025-10-10 07:55:50'),(9,3,'หาผู้ค้ำประกัน','2025-10-10 07:55:50');
/*!40000 ALTER TABLE `action_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_rules`
--

DROP TABLE IF EXISTS `bank_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bank_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criteria` text COLLATE utf8mb4_unicode_ci,
  `dsr_high` decimal(5,2) DEFAULT NULL,
  `dsr_low` decimal(5,2) DEFAULT NULL,
  `min_income_for_dsr_high` int DEFAULT NULL,
  `age_min` int DEFAULT NULL,
  `age_max` int DEFAULT NULL,
  `max_term` int DEFAULT NULL,
  `ltv_type1` decimal(5,2) DEFAULT NULL,
  `ltv_type2_over_2years` decimal(5,2) DEFAULT NULL,
  `ltv_type2_under_2years` decimal(5,2) DEFAULT NULL,
  `ltv_type3` decimal(5,2) DEFAULT NULL,
  `installment_rates` text COLLATE utf8mb4_unicode_ci,
  `interest_rates` text COLLATE utf8mb4_unicode_ci,
  `partnership_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Standard_Commercial',
  `min_credit_score` int DEFAULT '600',
  `max_ltv_rent_to_own` decimal(5,2) DEFAULT '80.00',
  `preferred_interest_rate` decimal(5,2) DEFAULT '4.50',
  `max_term_rent_to_own` int DEFAULT '25',
  `special_programs` text COLLATE utf8mb4_unicode_ci,
  `livnex_bonus` int DEFAULT '0',
  `exclude_status` text COLLATE utf8mb4_unicode_ci,
  `acceptable_grades` text COLLATE utf8mb4_unicode_ci,
  `loan_weight` decimal(3,2) DEFAULT '0.40',
  `rent_to_own_weight` decimal(3,2) DEFAULT '0.30',
  `credit_weight` decimal(3,2) DEFAULT '0.30',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bank_code` (`bank_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_rules`
--

LOCK TABLES `bank_rules` WRITE;
/*!40000 ALTER TABLE `bank_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` int DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `businessOwnerType` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'ไม่ใช่เจ้าของธุรกิจ',
  `privateBusinessType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `projectName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `readyToTransfer` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `propertyValue` decimal(15,2) DEFAULT NULL,
  `rentToOwnValue` decimal(15,2) DEFAULT NULL,
  `monthlyRentToOwnRate` decimal(15,2) DEFAULT NULL,
  `propertyPrice` decimal(15,2) DEFAULT NULL,
  `discount` decimal(15,2) DEFAULT '0.00',
  `installmentMonths` int DEFAULT '12',
  `overpaidRent` decimal(15,2) DEFAULT '0.00',
  `rentRatePerMillion` decimal(15,2) DEFAULT '4100.00',
  `guaranteeMultiplier` decimal(5,2) DEFAULT '2.00',
  `prepaidRentMultiplier` decimal(5,2) DEFAULT '1.00',
  `transferYear` int DEFAULT '1',
  `annualInterestRate` decimal(5,2) DEFAULT '1.80',
  `income` decimal(15,2) DEFAULT NULL,
  `debt` decimal(15,2) DEFAULT NULL,
  `maxDebtAllowed` decimal(15,2) DEFAULT NULL,
  `loanTerm` decimal(5,2) DEFAULT NULL,
  `ltv` decimal(5,2) DEFAULT NULL,
  `ltvNote` text COLLATE utf8mb4_unicode_ci,
  `maxLoanAmount` decimal(15,2) DEFAULT NULL,
  `targetDate` date DEFAULT NULL,
  `officer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'ณัฐพงศ์ ไหมพรม',
  `selectedBank` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetBank` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recommendedLoanTerm` decimal(5,2) DEFAULT NULL,
  `recommendedInstallment` decimal(15,2) DEFAULT NULL,
  `potentialScore` decimal(5,2) DEFAULT NULL,
  `degreeOfOwnership` decimal(5,2) DEFAULT NULL,
  `financialStatus` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actionPlanProgress` decimal(5,2) DEFAULT NULL,
  `paymentHistory` text COLLATE utf8mb4_unicode_ci,
  `accountStatuses` text COLLATE utf8mb4_unicode_ci,
  `livnexCompleted` tinyint(1) DEFAULT '0',
  `creditScore` decimal(5,2) DEFAULT NULL,
  `creditNotes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'2025-10-10','ทดสอบ2 ลูกค้าใหม่',35,'0812345678',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2000000.00,100000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,10000.00,NULL,NULL,90.00,NULL,NULL,NULL,NULL,NULL,'KTB',NULL,NULL,50.00,0.00,'ดีเยี่ยม',0.00,'ไม่มีข้อมูล',NULL,NULL,NULL,NULL,'2025-10-10 02:45:18','2025-10-10 08:00:21'),(2,'2025-10-10','ทดสอบ ลูกค้าใหม่',35,'0812345678',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2000000.00,100000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,10000.00,NULL,NULL,90.00,NULL,NULL,NULL,NULL,NULL,'KTB',NULL,NULL,50.00,0.00,'ดีเยี่ยม',0.00,'ไม่มีข้อมูล',NULL,NULL,NULL,NULL,'2025-10-10 02:50:25','2025-10-10 02:50:25'),(3,'2025-10-10','ทดสอบ ลูกค้าใหม่3',35,'0812345678',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2000000.00,100000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,50000.00,10000.00,NULL,NULL,90.00,NULL,NULL,NULL,NULL,NULL,'KTB',NULL,NULL,50.00,0.00,'ดีเยี่ยม',0.00,'ไม่มีข้อมูล',NULL,NULL,NULL,NULL,'2025-10-10 07:55:50','2025-10-10 08:00:31');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_problems`
--

DROP TABLE IF EXISTS `loan_problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_problems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `problem` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  CONSTRAINT `loan_problems_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_problems`
--

LOCK TABLES `loan_problems` WRITE;
/*!40000 ALTER TABLE `loan_problems` DISABLE KEYS */;
INSERT INTO `loan_problems` VALUES (1,1,'ปัญหาหนี้สูง','2025-10-10 02:45:18'),(2,1,'รายได้ไม่พอ','2025-10-10 02:45:18'),(3,1,'ไม่มีหลักประกัน','2025-10-10 02:45:18'),(4,2,'ปัญหาหนี้สูง','2025-10-10 02:50:25'),(5,2,'รายได้ไม่พอ','2025-10-10 02:50:25'),(6,2,'ไม่มีหลักประกัน','2025-10-10 02:50:25'),(7,3,'ปัญหาหนี้สูง','2025-10-10 07:55:50'),(8,3,'รายได้ไม่พอ','2025-10-10 07:55:50'),(9,3,'ไม่มีหลักประกัน','2025-10-10 07:55:50');
/*!40000 ALTER TABLE `loan_problems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` date NOT NULL,
  `selected_installment` int DEFAULT NULL,
  `additional_notes` text COLLATE utf8mb4_unicode_ci,
  `debt_limit` int DEFAULT NULL,
  `loan_term_after` int DEFAULT NULL,
  `analyst` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','data_entry','data_user') COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` enum('เงินสดใจดี','CO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$Lm8lSIo0WSJr16GYvkcPV.ve6ZMO0Ib6PbOVvvDk98Gj.df6X.vdS','System Administrator','admin','CO',1,'2025-07-29 14:55:02','2025-07-29 14:55:02'),(2,'data_entry','$2a$10$oz.GnlHquwEBkhANM.JQYOcfAl5XDMWgIPO4TRryM968/ZjYX7mGy','เจ้าหน้าที่บันทึกข้อมูล','data_entry','เงินสดใจดี',1,'2025-07-29 14:55:02','2025-07-29 14:55:02'),(3,'data_user','$2a$10$2nmFd4v5h3qavc7En/H2geI0SR/uJjn10jMnwAB6KaYidB2KRXRiu','เจ้าหน้าที่ใช้งานข้อมูล','data_user','CO',1,'2025-07-29 14:55:02','2025-07-29 14:55:02');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-10  9:12:51
