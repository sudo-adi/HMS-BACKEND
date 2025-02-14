# HMS Backend API Documentation

This document provides comprehensive documentation for the Hospital Management System (HMS) Backend API.

## Base URL

```
http://localhost:8383
```

## Authentication

Currently, the API does not require authentication.

## User Management

### Get All Users

```http
GET /users
```

**Response**

```json
{
  "user_id_1": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "patient",
    "phone": "+1234567890",
    "dob": "1990-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get User by ID

```http
GET /users/:id
```

**Response**

```json
{
  "user_id": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "patient",
    "phone": "+1234567890",
    "dob": "1990-01-01T00:00:00.000Z"
  }
}
```

### Create New User

```http
POST /users
```

**Request Body**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient",
  "phone": "+1234567890",
  "dob": "1990-01-01",
  "gender": "male"
}
```

For doctor registration, additional fields are required:

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "doctor",
  "phone": "+1234567891",
  "dob": "1985-01-01",
  "specialization": "Cardiology",
  "department": "cardiology",
  "experience": 10,
  "education": ["MBBS", "MD"],
  "startAt": "09:00",
  "endAt": "17:00",
  "sessionDuration": 30
}
```

**Response**

```json
{
  "user_id": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "patient",
    "phone": "+1234567890",
    "dob": "1990-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User

```http
PATCH /users/:id
```

**Request Body**

```json
{
  "firstName": "John",
  "lastName": "Smith"
}
```

**Response**

```json
{
  "user_id": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "role": "patient",
    "phone": "+1234567890",
    "dob": "1990-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Delete User

```http
DELETE /users/:id
```

**Response**

```json
{
  "message": "User deleted successfully"
}
```

## Appointment Management

### Create Appointment

```http
POST /appointments
```

**Request Body**

```json
{
  "userId": "patient_id",
  "doctorId": "doctor_id",
  "dateTime": "2024-01-01T10:00:00.000Z",
  "type": "general",
  "duration": 30
}
```

**Response**

```json
{
  "appointment_id": {
    "userId": "patient_id",
    "doctorId": "doctor_id",
    "dateTime": "2024-01-01T10:00:00.000Z",
    "type": "general",
    "duration": 30,
    "status": "scheduled",
    "paymentStatus": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Appointment

```http
PATCH /appointments/:id
```

**Request Body**

```json
{
  "dateTime": "2024-01-02T10:00:00.000Z",
  "status": "rescheduled"
}
```

**Response**

```json
{
  "appointment_id": {
    "userId": "patient_id",
    "doctorId": "doctor_id",
    "dateTime": "2024-01-02T10:00:00.000Z",
    "status": "rescheduled",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Cancel Appointment

```http
PATCH /appointments/cancel/:id
```

**Response**

```json
{
  "message": "Appointment canceled successfully",
  "appointment": {
    "userId": "patient_id",
    "doctorId": "doctor_id",
    "dateTime": "2024-01-01T10:00:00.000Z",
    "status": "canceled",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Patient's Appointments

```http
GET /api/v1/appointments/:patientId
```

**Response**

```json
{
  "appointment_id_1": {
    "userId": "patient_id",
    "doctorId": "doctor_id",
    "dateTime": "2024-01-01T10:00:00.000Z",
    "status": "scheduled"
  },
  "appointment_id_2": {
    "userId": "patient_id",
    "doctorId": "doctor_id",
    "dateTime": "2024-01-02T14:00:00.000Z",
    "status": "completed"
  }
}
```

### Get Doctor's Appointments

```http
GET /appointments/:doctorId
```

**Response**

```json
{
  "appointment_id_1": {
    "userId": "patient_id",
    "doctorId": "doctor_id",
    "dateTime": "2024-01-01T10:00:00.000Z",
    "status": "scheduled"
  }
}
```

## Specialist Management

### Get All Specialists

```http
GET /api/v1/specialists
```

**Response**

```json
{
  "specialists": ["Cardiology", "Radiology", "General Medicine"]
}
```

## Error Responses

The API uses conventional HTTP response codes to indicate the success or failure of an API request.

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Error Response Format**

```json
{
  "error": "Error message"
}
```

or

```json
{
  "errors": ["Error message 1", "Error message 2"]
}
```