# PawPoint — Frontend Integration Guide

## Active Premium Subscription, Payment, Chat & Socket.io

This document outlines the frontend integration flow for **Active Premium** subscription, payment gateways (Stripe & Razorpay), and the Socket.io-based chat implementation.

---

## 1. Authentication & API Headers

All website APIs require the following headers:

- `Authorization: Bearer {token}`
- `Accept: application/json`

Token is obtained via: `POST /api/v1/login` (works for both pet owners and pet sitters).

- Owner-specific endpoints: `/api/v1/website/owner/...`
- Chat endpoints: `/api/v1/website/chat/...`

---

## 2. Subscription & Location Flow

Each **Active Premium** subscription is locked to the **Customer's (Pet Owner's) profile location** at purchase time.

### Prerequisites Before Checkout:

1. Ensure the logged-in owner has latitude and longitude saved on their profile.
2. If coordinates are missing, update them using:
    - `POST /api/v1/website/owner/update-profile` (or `update-service`)
    - Send: `address`, `city`, `country`, `latitude`, `longitude`.
3. If profile location is missing, `create-order` returns **HTTP 422** with the message:
    > _"Please complete your profile location (city and map coordinates) before purchasing Active Premium."_

### Post-Payment Business Rules:

- Backend stores a snapshot of `city`, `state`, `country`, `latitude`, and `longitude` on the subscription.
- Sitter chat radius (`radius_meter`) and monthly new sitter connection limits (`allowed_new_sitters`) are defined by the active payment configuration.
- Customers can chat with sitters within the `radius_meter` of their subscription location.
- Sitters outside the radius -> Show "purchase plan for this area" popup (`SHOW_LOCATION_SUBSCRIPTION_POPUP`).
- If the customer moves/needs to connect in a new city -> Update profile location -> Purchase a new subscription.
- Each billing period allows $N$ new sitter connections (default: 5).
- Once a customer and sitter accept a chat, they gain **permanent access** (no further credits/slots consumed for that pair).

---

## 3. Payment Gateway Integration (Stripe vs Razorpay)

The admin defines the active payment gateway. Do not hardcode.

### Step A: Fetch Configuration

- **API**: `GET /api/v1/website/owner/payment-config`
- **Response Fields**:
    - `payment_gateway`: `"stripe" | "razorpay"`
    - `is_recurring`: `true | false`
    - `chat_subscription_radius`: Radius in meters (e.g., `1000`)
    - `chat_new_sitter_limit`: Monthly new sitter connection limit (e.g., `5`)

### Step B: Create Order

- **API**: `POST /api/v1/website/owner/create-order`
- **Request Body**:
    ```json
    { "plan_id": 1 }
    ```
    _(Note: Amount/currency are resolved on the backend. Do not send `amount`, `currency`, or `sitter_id`.)_
- **Response (201)**:
    ```json
    {
      "status": true,
      "data": {
        "order": { "id": 12, ... },
        "gateway": "stripe" | "razorpay",
        "is_recurring": true,
        "internal_order_id": 12,
        "checkout_url": "https://...",
        "subscription_id": "sub_xxx" | null,
        "checkout_status": "created" | null,
        "checkout_name": "Site name",
        "checkout_description": "Plan name recurring subscription"
      }
    }
    ```

### Step C: Frontend Checkout Flow

1. Check `data.gateway`.
2. If `data.checkout_url` is present (not empty) -> Open in browser/WebView (Stripe checkout or Razorpay short URL hosted page).
3. If `gateway` is `"razorpay"` and `checkout_url` is not present -> Open the local Razorpay SDK using the payment config key and `data.subscription_id`.
4. Keep track of `data.internal_order_id` for success callbacks.

### Step D: Payment Success & Cancel Callbacks

- **Stripe Success Callback**:
  `GET /api/v1/website/owner/payment-success?gateway=stripe&session_id={CHECKOUT_SESSION_ID}`
- **Razorpay Success Callback**:
  `GET /api/v1/website/owner/payment-success?gateway=razorpay&order_id={internal_order_id}&razorpay_subscription_id={sub_id}&razorpay_payment_id={payment_id}&razorpay_signature={signature}`
- **Stripe Cancel Callback**:
  `GET /api/v1/website/owner/payment-cancel?session_id={CHECKOUT_SESSION_ID}`
- **Response Shape (200)**:
    ```json
    {
      "status": true,
      "message": "Payment successful.",
      "data": {
        "internal_order_id": 12,
        "plan_id": 1,
        "subscription_id": 8,
        "order": { ... }
      }
    }
    ```

---

## 4. Chat Access & Flow (can-chat)

Always validate chat permissions before starting or opening a conversation window.

### Step 1: Check Permissions

- **API**: `POST /api/v1/website/chat/can-chat`
- **Request**:
    ```json
    { "other_user_id": 123 }
    ```
    _(sitter ID if caller is owner; owner ID if caller is sitter)_
- **Response Fields (`data` object)**:
    - `result`: `ALLOW | ACCEPTANCE_REQUIRED | PAYMENT_REQUIRED | RENEWAL_REQUIRED`
    - `reason`: Code describing the status (e.g. `PERMANENT_ACCESS`, `CAN_INITIATE`, `OUTSIDE_SUBSCRIPTION_RADIUS`, etc.)
    - `ui_action`: Drives frontend modal/view states (see below)
    - `message`: Displayable message

### Step 2: Handle `ui_action`

- **`OPEN_CHAT`**: Route directly to the chat interface. Call `POST /api/v1/website/chat/start` if the room has not been initiated.
- **`SHOW_ACCEPT_CONVERSATION_POPUP`**: Display Accept/Decline action buttons/banner.
    - Non-initiator (acceptor) cannot send messages until accepted (`conversation.can_send === false`).
- **`SHOW_PURCHASE_POPUP`**: Prompt owner to purchase an Active Premium subscription.
- **`SHOW_RENEWAL_POPUP`**: Prompt owner that their subscription has expired.
- **`SHOW_LOCATION_SUBSCRIPTION_POPUP`**: Sitter is outside subscription radius. Prompt to ensure profile location is correct or buy plan for this area.
- **`SHOW_UPGRADE_POPUP`**: Monthly connections exhausted. Offer upgrade package.

---

## 5. Chat APIs & Socket.io Flow

When a user opens a chat room, execute the following steps:

### 1. Initialize Room

- **API**: `POST /api/v1/website/chat/start`
    - Body: `{ "other_user_id": 123 }`
- **Response**: Returns a `room_id` (UUID), `conversation` status, and other details.

### 2. Socket.io Events

- **Send Message**:
    - Use the returned `room_id` to emit the Socket.io event:
      `send_message`
- **Receive Message**:
    - The other user (and sender) will receive a Socket.io event:
      `new_message`
    - Upon receiving `new_message`, call `POST /api/v1/website/chat/messages` to fetch updated message logs.
- **Typing Indicators**:
    - When typing: Emit `typing:start` -> Other user receives `user_typing`.
    - When stopped: Emit `typing:stop` -> Other user clears typing state.
    - _Fallback_: Implement a local timeout to clear `user_typing` in case `typing:stop` is missed.

### 3. Accept / Decline Flow

- **Accept**: `POST /api/v1/website/chat/accept-conversation` with `{ "other_user_id": 123 }`
    - Deducts 1 connection credit from owner's monthly limit.
    - Changes status to `active`.
- **Decline**: `POST /api/v1/website/chat/decline-conversation` with `{ "other_user_id": 123 }`
    - No credit deducted.

---

## 6. HTTP Status Codes

- `200`: Success (always check `data.result` for chat/business rules).
- `201`: Order or message successfully created.
- `401`: Unauthorized / Re-login.
- `403`: Rule violation (e.g., trying to accept a conversation that isn't yours).
- `422`: Validation error (e.g., missing coordinates/city on profile).
- `502`: Chat service down.
