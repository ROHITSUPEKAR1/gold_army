-- ============================================================================
-- GOLD ARMY FITNESS CLUB — TiDB COMPLETE DATABASE SCHEMA & SEED SCRIPT
-- Compatible with: TiDB Serverless, TiDB Dedicated, TiDB Self-Hosted & MySQL 8.0+
-- Generated Date: 2026-09-28
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DATABASE INITIALIZATION & ENVIRONMENT SETUP
-- ----------------------------------------------------------------------------
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

CREATE DATABASE IF NOT EXISTS `gold_army` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gold_army`;

-- ----------------------------------------------------------------------------
-- 2. DROP EXISTING TABLES (REVERSE DEPENDENCY ORDER)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `_prisma_migrations`;
DROP TABLE IF EXISTS `Referral`;
DROP TABLE IF EXISTS `CouponPlan`;
DROP TABLE IF EXISTS `Coupon`;
DROP TABLE IF EXISTS `Offer`;
DROP TABLE IF EXISTS `NotificationLog`;
DROP TABLE IF EXISTS `NotificationRecipient`;
DROP TABLE IF EXISTS `Notification`;
DROP TABLE IF EXISTS `Progress`;
DROP TABLE IF EXISTS `PtSession`;
DROP TABLE IF EXISTS `MemberDietPlan`;
DROP TABLE IF EXISTS `DietMeal`;
DROP TABLE IF EXISTS `DietPlan`;
DROP TABLE IF EXISTS `MemberWorkout`;
DROP TABLE IF EXISTS `WorkoutExercise`;
DROP TABLE IF EXISTS `Workout`;
DROP TABLE IF EXISTS `Exercise`;
DROP TABLE IF EXISTS `Attendance`;
DROP TABLE IF EXISTS `Payment`;
DROP TABLE IF EXISTS `Subscription`;
DROP TABLE IF EXISTS `PlanService`;
DROP TABLE IF EXISTS `Plan`;
DROP TABLE IF EXISTS `Service`;
DROP TABLE IF EXISTS `TrainerMember`;
DROP TABLE IF EXISTS `Trainer`;
DROP TABLE IF EXISTS `Member`;
DROP TABLE IF EXISTS `User`;

-- ----------------------------------------------------------------------------
-- 3. TABLE DEFINITIONS (DDL)
-- ----------------------------------------------------------------------------

-- Table: User
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'TRAINER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `refreshTokenHash` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_phone_key`(`phone`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_status_idx`(`role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Member
CREATE TABLE `Member` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `heightCm` DECIMAL(5, 2) NULL,
    `weightKg` DECIMAL(5, 2) NULL,
    `fitnessGoal` VARCHAR(191) NULL,
    `emergencyPhone` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Member_userId_key`(`userId`),
    INDEX `Member_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Trainer
CREATE TABLE `Trainer` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `specialization` VARCHAR(191) NULL,
    `experienceYears` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Trainer_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: TrainerMember
CREATE TABLE `TrainerMember` (
    `trainerId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`trainerId`, `memberId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Service
CREATE TABLE `Service` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Service_name_key`(`name`),
    INDEX `Service_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Plan
CREATE TABLE `Plan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `durationMonths` INTEGER NULL,
    `durationDays` INTEGER NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `isPremium` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `Plan_isActive_isPopular_idx`(`isActive`, `isPopular`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: PlanService
CREATE TABLE `PlanService` (
    `planId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`planId`, `serviceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Subscription
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'FROZEN', 'PAYMENT_PENDING') NOT NULL DEFAULT 'PAYMENT_PENDING',
    `frozenAt` DATETIME(3) NULL,
    `frozenUntil` DATETIME(3) NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `Subscription_memberId_status_idx`(`memberId`, `status`),
    INDEX `Subscription_endDate_status_idx`(`endDate`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Payment
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `finalAmount` DECIMAL(10, 2) NOT NULL,
    `method` ENUM('CASH', 'UPI', 'CARD', 'RAZORPAY') NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paidAt` DATETIME(3) NULL,
    `refundedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Payment_transactionId_key`(`transactionId`),
    INDEX `Payment_memberId_status_idx`(`memberId`, `status`),
    INDEX `Payment_createdAt_status_idx`(`createdAt`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Attendance
CREATE TABLE `Attendance` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `checkInDate` DATE NOT NULL,
    `checkInTime` DATETIME(3) NOT NULL,
    `method` ENUM('QR', 'MANUAL') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Attendance_checkInDate_idx`(`checkInDate`),
    UNIQUE INDEX `Attendance_memberId_checkInDate_key`(`memberId`, `checkInDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Exercise
CREATE TABLE `Exercise` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `targetMuscle` VARCHAR(191) NOT NULL,
    `difficulty` VARCHAR(191) NOT NULL,
    `instructions` TEXT NULL,
    `videoUrl` VARCHAR(500) NULL,
    `imageUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Workout
CREATE TABLE `Workout` (
    `id` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `goal` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `durationMin` INTEGER NULL,
    `calories` INTEGER NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: WorkoutExercise
CREATE TABLE `WorkoutExercise` (
    `workoutId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `sets` INTEGER NOT NULL,
    `reps` INTEGER NOT NULL,
    `weight` VARCHAR(191) NULL,
    `restSec` INTEGER NULL,
    `trainerNotes` TEXT NULL,

    PRIMARY KEY (`workoutId`, `exerciseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: MemberWorkout
CREATE TABLE `MemberWorkout` (
    `memberId` VARCHAR(191) NOT NULL,
    `workoutId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    PRIMARY KEY (`memberId`, `workoutId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: DietPlan
CREATE TABLE `DietPlan` (
    `id` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `goal` VARCHAR(191) NOT NULL,
    `dietType` ENUM('VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN') NOT NULL,
    `calories` INTEGER NOT NULL,
    `proteinG` INTEGER NOT NULL,
    `carbsG` INTEGER NOT NULL,
    `fatsG` INTEGER NOT NULL,
    `budget` DECIMAL(10, 2) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: DietMeal
CREATE TABLE `DietMeal` (
    `id` VARCHAR(191) NOT NULL,
    `dietPlanId` VARCHAR(191) NOT NULL,
    `mealType` VARCHAR(191) NOT NULL,
    `timing` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` VARCHAR(191) NULL,
    `calories` INTEGER NOT NULL,
    `proteinG` INTEGER NOT NULL,
    `estimatedCost` DECIMAL(10, 2) NULL,
    `preparationNotes` TEXT NULL,

    INDEX `DietMeal_dietPlanId_mealType_idx`(`dietPlanId`, `mealType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: MemberDietPlan
CREATE TABLE `MemberDietPlan` (
    `memberId` VARCHAR(191) NOT NULL,
    `dietPlanId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`memberId`, `dietPlanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: PtSession
CREATE TABLE `PtSession` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `status` ENUM('UPCOMING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `PtSession_trainerId_startsAt_status_idx`(`trainerId`, `startsAt`, `status`),
    INDEX `PtSession_memberId_startsAt_idx`(`memberId`, `startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Progress
CREATE TABLE `Progress` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `measuredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `weightKg` DECIMAL(5, 2) NULL,
    `bodyFat` DECIMAL(5, 2) NULL,
    `measurements` JSON NULL,
    `photoUrls` JSON NULL,
    `notes` TEXT NULL,
    `personalRecords` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `Progress_memberId_measuredAt_idx`(`memberId`, `measuredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Notification
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `audience` ENUM('ALL_MEMBERS', 'SELECTED_MEMBERS', 'EXPIRING_MEMBERS', 'EXPIRED_MEMBERS', 'SPECIFIC_SERVICE', 'SPECIFIC_PLAN') NOT NULL,
    `scheduledAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_audience_createdAt_idx`(`audience`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: NotificationRecipient
CREATE TABLE `NotificationRecipient` (
    `notificationId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NULL,

    PRIMARY KEY (`notificationId`, `memberId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: NotificationLog
CREATE TABLE `NotificationLog` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `dedupeKey` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NotificationLog_dedupeKey_key`(`dedupeKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Offer
CREATE TABLE `Offer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `discount` DECIMAL(10, 2) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Coupon
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Coupon_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: CouponPlan
CREATE TABLE `CouponPlan` (
    `couponId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`couponId`, `planId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: Referral
CREATE TABLE `Referral` (
    `id` VARCHAR(191) NOT NULL,
    `referrerId` VARCHAR(191) NOT NULL,
    `referredId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Referral_referrerId_referredId_key`(`referrerId`, `referredId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: _prisma_migrations (Enables seamless Prisma CLI compatibility)
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3) NULL,
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT NULL,
    `rolled_back_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. FOREIGN KEY CONSTRAINTS
-- ----------------------------------------------------------------------------
ALTER TABLE `Member` ADD CONSTRAINT `Member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Trainer` ADD CONSTRAINT `Trainer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `TrainerMember` ADD CONSTRAINT `TrainerMember_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `Trainer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TrainerMember` ADD CONSTRAINT `TrainerMember_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PlanService` ADD CONSTRAINT `PlanService_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PlanService` ADD CONSTRAINT `PlanService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Workout` ADD CONSTRAINT `Workout_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `Trainer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `WorkoutExercise` ADD CONSTRAINT `WorkoutExercise_workoutId_fkey` FOREIGN KEY (`workoutId`) REFERENCES `Workout`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WorkoutExercise` ADD CONSTRAINT `WorkoutExercise_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `MemberWorkout` ADD CONSTRAINT `MemberWorkout_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MemberWorkout` ADD CONSTRAINT `MemberWorkout_workoutId_fkey` FOREIGN KEY (`workoutId`) REFERENCES `Workout`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DietPlan` ADD CONSTRAINT `DietPlan_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `Trainer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `DietMeal` ADD CONSTRAINT `DietMeal_dietPlanId_fkey` FOREIGN KEY (`dietPlanId`) REFERENCES `DietPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MemberDietPlan` ADD CONSTRAINT `MemberDietPlan_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MemberDietPlan` ADD CONSTRAINT `MemberDietPlan_dietPlanId_fkey` FOREIGN KEY (`dietPlanId`) REFERENCES `DietPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PtSession` ADD CONSTRAINT `PtSession_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `PtSession` ADD CONSTRAINT `PtSession_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `Trainer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Progress` ADD CONSTRAINT `Progress_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `NotificationLog` ADD CONSTRAINT `NotificationLog_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `NotificationLog` ADD CONSTRAINT `NotificationLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CouponPlan` ADD CONSTRAINT `CouponPlan_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CouponPlan` ADD CONSTRAINT `CouponPlan_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referredId_fkey` FOREIGN KEY (`referredId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 5. INITIAL SEED DATA (CORE USERS, SERVICES, PLANS, EXERCISES, WORKOUTS, DIETS)
-- Password for all seeded users is: GoldArmy123!
-- ----------------------------------------------------------------------------

-- Seed Users: Admin, Trainer, Member
INSERT INTO `User` (`id`, `phone`, `email`, `passwordHash`, `name`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
('usr-admin-01', NULL, 'owner@goldarmy.local', '$2b$12$2FMKUdJc7AzSsU6kGlj.JuwYI53cCPX4GBIf0BimMzfuMwgC710Oy', 'Gold Army Owner', 'ADMIN', 'ACTIVE', NOW(3), NOW(3)),
('usr-trainer-01', NULL, 'trainer@goldarmy.local', '$2b$12$2FMKUdJc7AzSsU6kGlj.JuwYI53cCPX4GBIf0BimMzfuMwgC710Oy', 'Aditya Rao', 'TRAINER', 'ACTIVE', NOW(3), NOW(3)),
('usr-member-01', '+919822104000', 'rohan@example.com', '$2b$12$2FMKUdJc7AzSsU6kGlj.JuwYI53cCPX4GBIf0BimMzfuMwgC710Oy', 'Rohan Deshmukh', 'MEMBER', 'ACTIVE', NOW(3), NOW(3));

-- Seed Trainer Profile
INSERT INTO `Trainer` (`id`, `userId`, `specialization`, `experienceYears`, `isActive`, `createdAt`, `updatedAt`) VALUES
('trn-01', 'usr-trainer-01', 'Strength & Hypertrophy', 6, 1, NOW(3), NOW(3));

-- Seed Member Profile
INSERT INTO `Member` (`id`, `userId`, `dateOfBirth`, `gender`, `heightCm`, `weightKg`, `fitnessGoal`, `emergencyPhone`, `isActive`, `createdAt`, `updatedAt`) VALUES
('mbr-01', 'usr-member-01', '1998-05-15 00:00:00.000', 'MALE', 178.00, 78.00, 'Muscle Gain', '+919822104001', 1, NOW(3), NOW(3));

-- Seed Trainer-Member Assignment
INSERT INTO `TrainerMember` (`trainerId`, `memberId`, `assignedAt`) VALUES
('trn-01', 'mbr-01', NOW(3));

-- Seed Services
INSERT INTO `Service` (`id`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`) VALUES
('srv-gym', 'General Gym', 'Full floor access to strength and free weights area', 1, NOW(3), NOW(3)),
('srv-cardio', 'Cardio', 'Cardio cinema and interval endurance equipment access', 1, NOW(3), NOW(3)),
('srv-pt', 'Personal Training', 'Dedicated 1-on-1 certified coaching sessions', 1, NOW(3), NOW(3)),
('srv-gym-cardio', 'Gym + Cardio', 'Combined floor strength & cardio section pass', 1, NOW(3), NOW(3)),
('srv-gym-pt', 'Gym + PT', 'Full gym membership with allocated personal trainer', 1, NOW(3), NOW(3)),
('srv-all-inclusive', 'Gym + Cardio + PT', 'Complete VIP fitness access including all amenities', 1, NOW(3), NOW(3));

-- Seed Plans
INSERT INTO `Plan` (`id`, `name`, `durationMonths`, `durationDays`, `price`, `discount`, `isPopular`, `isPremium`, `isActive`, `createdAt`, `updatedAt`) VALUES
('plan-gym-monthly', 'General Gym (Monthly)', 1, NULL, 1999.00, 0.00, 0, 0, 1, NOW(3), NOW(3)),
('plan-gym-cardio-q', 'Gym + Cardio (Quarterly)', 3, NULL, 5499.00, 1500.00, 1, 0, 1, NOW(3), NOW(3)),
('seed-gold-quarterly', 'Gold Quarterly (Gym + PT)', 3, NULL, 8499.00, 1000.00, 1, 1, 1, NOW(3), NOW(3)),
('plan-pt-package-12', 'Personal Training (12 Sessions)', NULL, 45, 8999.00, 1000.00, 0, 0, 1, NOW(3), NOW(3)),
('plan-gym-pt-h', 'Gym + Cardio + PT (Half-Yearly)', 6, NULL, 16999.00, 3000.00, 0, 1, 1, NOW(3), NOW(3)),
('plan-gold-annual', 'Gold Elite Annual', 12, NULL, 24999.00, 5000.00, 0, 1, 1, NOW(3), NOW(3));

-- Seed Plan-Service Links
INSERT INTO `PlanService` (`planId`, `serviceId`) VALUES
('plan-gym-monthly', 'srv-gym'),
('plan-gym-cardio-q', 'srv-gym-cardio'),
('plan-gym-cardio-q', 'srv-gym'),
('plan-gym-cardio-q', 'srv-cardio'),
('seed-gold-quarterly', 'srv-gym-pt'),
('seed-gold-quarterly', 'srv-gym'),
('plan-pt-package-12', 'srv-pt'),
('plan-gym-pt-h', 'srv-all-inclusive'),
('plan-gym-pt-h', 'srv-gym-pt'),
('plan-gym-pt-h', 'srv-pt'),
('plan-gold-annual', 'srv-all-inclusive');

-- Seed Active Subscription
INSERT INTO `Subscription` (`id`, `memberId`, `planId`, `serviceId`, `startDate`, `endDate`, `status`, `frozenAt`, `frozenUntil`, `discount`, `isDeleted`, `createdAt`, `updatedAt`) VALUES
('seed-subscription', 'mbr-01', 'seed-gold-quarterly', 'srv-gym-pt', '2026-07-12 00:00:00.000', '2026-10-04 23:59:59.000', 'ACTIVE', NULL, NULL, 1000.00, 0, NOW(3), NOW(3));

-- Seed Initial Payment Record
INSERT INTO `Payment` (`id`, `memberId`, `subscriptionId`, `amount`, `discount`, `finalAmount`, `method`, `transactionId`, `status`, `paidAt`, `refundedAt`, `createdAt`, `updatedAt`) VALUES
('pay-seed-01', 'mbr-01', 'seed-subscription', 8499.00, 1000.00, 7499.00, 'UPI', 'UPI-TXN-20260712-001', 'SUCCESSFUL', '2026-07-12 10:30:00.000', NULL, NOW(3), NOW(3));

-- Seed Master Exercise Library
INSERT INTO `Exercise` (`id`, `name`, `targetMuscle`, `difficulty`, `instructions`, `videoUrl`, `imageUrl`, `createdAt`, `updatedAt`) VALUES
('ex-bench-press', 'Barbell Bench Press', 'Chest', 'Intermediate', 'Lie flat, grip bar slightly wider than shoulder-width. Lower to mid-chest with control and press up explosively.', 'https://assets.goldarmy.local/videos/bench-press.mp4', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80', NOW(3), NOW(3)),
('ex-incline-dumbbell', 'Incline Dumbbell Press', 'Chest', 'Intermediate', 'Set bench to 30-45°. Press dumbbells overhead with palms forward. Lower until elbows hit 90° and contract chest.', 'https://assets.goldarmy.local/videos/incline-press.mp4', NULL, NOW(3), NOW(3)),
('ex-lat-pulldown', 'Wide-Grip Lat Pulldown', 'Back', 'Beginner', 'Grip bar wide with palms away. Pull down to upper chest while arching slightly and squeezing shoulder blades.', 'https://assets.goldarmy.local/videos/lat-pulldown.mp4', NULL, NOW(3), NOW(3)),
('ex-barbell-row', 'Bent-Over Barbell Row', 'Back', 'Advanced', 'Hinge at hips at 45° angle with flat back. Pull bar towards belly button driving through elbows.', 'https://assets.goldarmy.local/videos/barbell-row.mp4', NULL, NOW(3), NOW(3)),
('ex-overhead-press', 'Standing Overhead Barbell Press', 'Shoulders', 'Intermediate', 'Stand tall with core braced. Press barbell from collarbone to overhead lockout, tucking chin as bar passes.', 'https://assets.goldarmy.local/videos/overhead-press.mp4', NULL, NOW(3), NOW(3)),
('ex-lateral-raise', 'Dumbbell Lateral Raise', 'Shoulders', 'Beginner', 'Slight bend in elbows. Raise dumbbells to shoulder level leading with elbows and control descent.', 'https://assets.goldarmy.local/videos/lateral-raise.mp4', NULL, NOW(3), NOW(3)),
('ex-barbell-squat', 'Barbell Back Squat', 'Legs', 'Advanced', 'Rest bar across traps. Descend until thighs are parallel to floor and drive back up through midfoot.', 'https://assets.goldarmy.local/videos/squat.mp4', NULL, NOW(3), NOW(3)),
('ex-leg-press', '45-Degree Leg Press', 'Legs', 'Beginner', 'Feet shoulder-width on platform. Lower sled until knees reach 90° and press firmly through heels.', 'https://assets.goldarmy.local/videos/leg-press.mp4', NULL, NOW(3), NOW(3)),
('ex-bicep-curl', 'EZ-Bar Bicep Curl', 'Biceps', 'Beginner', 'Lock elbows at sides. Curl bar upward contracting biceps at the top without swinging torso.', 'https://assets.goldarmy.local/videos/bicep-curl.mp4', NULL, NOW(3), NOW(3)),
('ex-tricep-pushdown', 'Cable Tricep Rope Pushdown', 'Triceps', 'Beginner', 'Grip rope attachment with neutral grip. Extend arms downward, spreading rope at bottom contraction.', 'https://assets.goldarmy.local/videos/tricep-pushdown.mp4', NULL, NOW(3), NOW(3)),
('ex-hanging-leg-raise', 'Hanging Leg Raise', 'Core', 'Intermediate', 'Hang from pull-up bar. Without swinging, curl pelvis and lift knees to chest engaging lower abs.', 'https://assets.goldarmy.local/videos/hanging-leg-raise.mp4', NULL, NOW(3), NOW(3)),
('ex-treadmill-hiit', 'Incline Treadmill Sprints', 'Cardio', 'Intermediate', 'Perform intervals of 30 sec sprint at 12% incline followed by 60 sec walking recovery.', 'https://assets.goldarmy.local/videos/treadmill-hiit.mp4', NULL, NOW(3), NOW(3));

-- Seed Workouts
INSERT INTO `Workout` (`id`, `trainerId`, `name`, `goal`, `notes`, `durationMin`, `calories`, `isDeleted`, `createdAt`, `updatedAt`) VALUES
('seed-push-day', 'trn-01', 'Push Day (Hypertrophy)', 'Muscle Gain', 'Focus on progressive overload on bench press. Control negative reps on isolation exercises.', 50, 420, 0, NOW(3), NOW(3)),
('seed-pull-day', 'trn-01', 'Pull Day (Back & Biceps)', 'Strength', 'Maintain strict form on barbell rows. Do not let lower back round.', 45, 380, 0, NOW(3), NOW(3));

-- Seed Workout Exercises
INSERT INTO `WorkoutExercise` (`workoutId`, `exerciseId`, `order`, `sets`, `reps`, `weight`, `restSec`, `trainerNotes`) VALUES
('seed-push-day', 'ex-bench-press', 1, 4, 8, '65 kg', 90, 'Warm up with empty bar first.'),
('seed-push-day', 'ex-incline-dumbbell', 2, 3, 10, '22 kg', 75, 'Elbows at 45 degrees.'),
('seed-push-day', 'ex-overhead-press', 3, 3, 8, '40 kg', 90, 'Keep glutes squeezed.'),
('seed-push-day', 'ex-lateral-raise', 4, 4, 15, '10 kg', 60, 'Slight forward lean.'),
('seed-push-day', 'ex-tricep-pushdown', 5, 3, 12, '25 kg', 60, 'Full lockout at bottom.'),
('seed-pull-day', 'ex-lat-pulldown', 1, 4, 10, '55 kg', 75, 'Squeeze lats at bottom.'),
('seed-pull-day', 'ex-barbell-row', 2, 4, 8, '60 kg', 90, 'Keep chest up.'),
('seed-pull-day', 'ex-bicep-curl', 3, 3, 12, '25 kg', 60, 'No momentum.'),
('seed-pull-day', 'ex-hanging-leg-raise', 4, 3, 15, 'Bodyweight', 45, 'Controlled negative.');

-- Seed Member Workout Assignment
INSERT INTO `MemberWorkout` (`memberId`, `workoutId`, `assignedAt`, `completedAt`) VALUES
('mbr-01', 'seed-push-day', NOW(3), NULL),
('mbr-01', 'seed-pull-day', NOW(3), NULL);

-- Seed Diet Plans
INSERT INTO `DietPlan` (`id`, `trainerId`, `name`, `goal`, `dietType`, `calories`, `proteinG`, `carbsG`, `fatsG`, `budget`, `isDeleted`, `createdAt`, `updatedAt`) VALUES
('seed-diet-veg-muscle', 'trn-01', 'Vegetarian High-Protein Hypertrophy', 'Muscle Gain', 'VEGETARIAN', 2640, 160, 280, 70, 350.00, 0, NOW(3), NOW(3)),
('seed-diet-nonveg-loss', 'trn-01', 'Lean Cut Non-Vegetarian', 'Weight Loss', 'NON_VEGETARIAN', 1950, 175, 160, 50, 380.00, 0, NOW(3), NOW(3));

-- Seed Diet Meals (Vegetarian)
INSERT INTO `DietMeal` (`id`, `dietPlanId`, `mealType`, `timing`, `name`, `quantity`, `calories`, `proteinG`, `estimatedCost`, `preparationNotes`) VALUES
('meal-v-1', 'seed-diet-veg-muscle', 'BREAKFAST', '8:00 AM', 'Paneer Bhurji + 2 Multigrain Rotis + Almonds', '150g Paneer, 2 Rotis', 480, 30, 65.00, 'Cook paneer with minimal olive oil, turmeric and green chillies.'),
('meal-v-2', 'seed-diet-veg-muscle', 'MID-MORNING', '11:00 AM', 'Whey Protein Isolate + Banana + Chia Seeds', '1 Scoop Whey, 1 Banana', 280, 26, 50.00, 'Blend with chilled water or almond milk.'),
('meal-v-3', 'seed-diet-veg-muscle', 'LUNCH', '1:30 PM', 'Thick Dal Tadka + Steamed Brown Rice + Curd + Salad', '200g Dal, 150g Rice, 100g Curd', 620, 28, 80.00, 'Use moong and toor dal combination for complete amino profile.'),
('meal-v-4', 'seed-diet-veg-muscle', 'PRE-WORKOUT', '5:00 PM', 'Peanut Butter on Whole Wheat Toast + Black Coffee', '2 Slices, 30g PB', 320, 14, 35.00, 'Consume 45 minutes before strength training session.'),
('meal-v-5', 'seed-diet-veg-muscle', 'POST-WORKOUT', '7:30 PM', 'Roasted Chana + Protein Shake / Soya Chunks', '50g Roasted Chana, 1 Scoop', 410, 34, 60.00, 'Fast-digesting protein within 30 mins of workout.'),
('meal-v-6', 'seed-diet-veg-muscle', 'DINNER', '9:30 PM', 'Soya Chunk Curry + 2 Phulkas + Cucumber Salad', '60g Soya chunks, 2 Phulkas', 530, 28, 60.00, 'Light sodium in the evening to reduce water retention.');

-- Seed Diet Meals (Non-Vegetarian)
INSERT INTO `DietMeal` (`id`, `dietPlanId`, `mealType`, `timing`, `name`, `quantity`, `calories`, `proteinG`, `estimatedCost`, `preparationNotes`) VALUES
('meal-nv-1', 'seed-diet-nonveg-loss', 'BREAKFAST', '8:00 AM', '4 Boiled Egg Whites + 1 Whole Egg + Oats', '5 Eggs, 40g Oats', 380, 32, 55.00, 'Boil eggs fresh with black pepper.'),
('meal-nv-2', 'seed-diet-nonveg-loss', 'LUNCH', '1:00 PM', 'Grilled Chicken Breast + Quinoa + Green Beans', '180g Chicken, 80g Quinoa', 520, 48, 110.00, 'Marinate chicken in lemon, garlic, and curd.'),
('meal-nv-3', 'seed-diet-nonveg-loss', 'PRE-WORKOUT', '4:30 PM', 'Apple + Green Tea + 5 Almonds', '1 Apple, 5 Almonds', 140, 3, 25.00, 'Light clean carbs for workout energy.'),
('meal-nv-4', 'seed-diet-nonveg-loss', 'POST-WORKOUT', '7:00 PM', 'Whey Protein Isolate in Water', '1 Scoop', 120, 25, 45.00, 'Direct absorption.'),
('meal-nv-5', 'seed-diet-nonveg-loss', 'DINNER', '8:30 PM', 'Grilled Fish / Chicken Tikka + Broccoli Stir Fry', '200g Fish / Chicken', 450, 42, 120.00, 'High protein, low carb dinner.');

-- Seed Member Diet Assignment
INSERT INTO `MemberDietPlan` (`memberId`, `dietPlanId`, `assignedAt`) VALUES
('mbr-01', 'seed-diet-veg-muscle', NOW(3));

-- Seed Member Progress & PRs
INSERT INTO `Progress` (`id`, `memberId`, `measuredAt`, `weightKg`, `bodyFat`, `measurements`, `photoUrls`, `notes`, `personalRecords`, `createdAt`, `updatedAt`) VALUES
('prg-01', 'mbr-01', DATE_SUB(NOW(3), INTERVAL 35 DAY), 82.50, 21.00, '{"chestIn": 39.5, "waistIn": 36.0, "armsIn": 13.5, "thighsIn": 22.0}', '[]', 'Initial fitness baseline. High enthusiasm.', '{"Barbell Bench Press": {"exerciseName": "Barbell Bench Press", "weightKg": 50, "reps": 8, "date": "2026-08-07", "notes": "First test."}, "Barbell Back Squat": {"exerciseName": "Barbell Back Squat", "weightKg": 65, "reps": 8, "date": "2026-08-07"}}', NOW(3), NOW(3)),
('prg-02', 'mbr-01', DATE_SUB(NOW(3), INTERVAL 21 DAY), 80.20, 19.50, '{"chestIn": 40.2, "waistIn": 35.0, "armsIn": 13.8, "thighsIn": 22.5}', '[]', 'Significant energy improvement and tighter core.', '{"Barbell Bench Press": {"exerciseName": "Barbell Bench Press", "weightKg": 57.5, "reps": 8, "date": "2026-08-21"}, "Barbell Back Squat": {"exerciseName": "Barbell Back Squat", "weightKg": 75, "reps": 6, "date": "2026-08-21"}}', NOW(3), NOW(3)),
('prg-03', 'mbr-01', DATE_SUB(NOW(3), INTERVAL 7 DAY), 78.80, 18.20, '{"chestIn": 41.0, "waistIn": 34.0, "armsIn": 14.2, "thighsIn": 23.0}', '[]', 'Gained noticeable shoulder cap definition and chest fullness.', '{"Barbell Bench Press": {"exerciseName": "Barbell Bench Press", "weightKg": 65, "reps": 8, "date": "2026-09-04", "notes": "Clean paused reps."}, "Barbell Back Squat": {"exerciseName": "Barbell Back Squat", "weightKg": 85, "reps": 8, "date": "2026-09-04"}, "Deadlift": {"exerciseName": "Deadlift", "weightKg": 110, "reps": 5, "date": "2026-09-04", "notes": "Double overhand grip."}}', NOW(3), NOW(3));

-- Seed Promotional Coupons & Offers
INSERT INTO `Coupon` (`id`, `code`, `discount`, `maxUses`, `usedCount`, `expiresAt`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cpn-gold500', 'GOLD500', 500.00, 100, 4, DATE_ADD(NOW(3), INTERVAL 90 DAY), 1, NOW(3), NOW(3)),
('cpn-festive1000', 'FESTIVE1000', 1000.00, 50, 12, DATE_ADD(NOW(3), INTERVAL 30 DAY), 1, NOW(3), NOW(3));

INSERT INTO `Offer` (`id`, `name`, `description`, `discount`, `startsAt`, `endsAt`, `isActive`, `createdAt`, `updatedAt`) VALUES
('ofr-monsoon', 'Monsoon Transformation Drive', 'Get flat ₹1500 off on all quarterly & annual memberships', 1500.00, DATE_SUB(NOW(3), INTERVAL 10 DAY), DATE_ADD(NOW(3), INTERVAL 50 DAY), 1, NOW(3), NOW(3));

-- Register Prisma Migration Checksum
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('0001_init', 'a3f728c0bdf0c1e828e3b12ef84a1d48', NOW(3), '0001_init', NULL, NULL, NOW(3), 1)
ON DUPLICATE KEY UPDATE `finished_at` = NOW(3);

-- ----------------------------------------------------------------------------
-- 6. RE-ENABLE FOREIGN KEYS
-- ----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================
