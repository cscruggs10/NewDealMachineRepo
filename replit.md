# Deal Machine - Wholesale Auto Dealer Marketplace

## Overview

Deal Machine is a full-stack web application for wholesale automotive marketplace operations. It enables vehicle uploading, inventory management, dealer interactions, and transaction processing. The system features a React frontend with TypeScript, Express.js backend, PostgreSQL database via Neon, and integrates with third-party services for enhanced functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**July 28, 2025**
- Fixed Buy Now button functionality on individual vehicle pages
- Added contact information dialog for users without buy codes: (555) 123-DEAL
- Fixed video URL issues by updating database to use relative paths instead of old domains
- Added video file type filtering to only display actual video content (.mp4, .mov, .MOV, .webm)
- Debug logs confirmed video detection working correctly (console shows "Has video: true")
- Video thumbnails should display on home page for vehicles 13 and 14 (Honda Accord and Subaru Outback)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Custom component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme system
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with JSON responses
- **File Handling**: Multer for multipart form data processing
- **Session Management**: Express sessions for authentication

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **Database Schema**: Defined using Drizzle ORM with proper relationships
- **File Storage**: Local filesystem with future cloud storage integration
- **Migration Strategy**: Drizzle Kit for schema migrations

## Key Components

### Vehicle Management System
- **VIN Decoding**: Integration with NHTSA API for automatic vehicle information retrieval
- **Media Upload**: Support for images and videos with compression
- **Pricing Queue**: Admin workflow for setting vehicle prices before publication
- **Status Tracking**: Vehicle lifecycle management (pending → active → sold)

### Dealer Management
- **Registration**: Comprehensive dealer profile creation with multiple contact types
- **Buy Codes**: Unique 4-character codes for vehicle purchasing authorization
- **Transaction Tracking**: Complete purchase history and billing management

### Admin Dashboard
- **Multi-tab Interface**: Separate management areas for different operational aspects
- **Real-time Updates**: Live data synchronization across admin panels
- **Bulk Operations**: Efficient handling of multiple vehicles and transactions

### Authentication System
- **Admin Access**: Password-based authentication for administrative functions
- **Dealer Portal**: Secure dealer login with session management
- **Route Protection**: Middleware-based access control

## Data Flow

### Vehicle Upload Process
1. User provides VIN via manual entry or QR code scanning
2. System validates VIN format and decodes vehicle information
3. User uploads walkthrough videos and additional media
4. Vehicle enters pricing queue for admin review
5. Admin sets price and publishes to active inventory

### Purchase Workflow
1. Buyer identifies vehicle and initiates purchase
2. System validates buy code and dealer authorization
3. Transaction record created with dealer and vehicle details
4. Admin processes payment and title transfer
5. Vehicle status updated to sold

### Data Synchronization
- Frontend queries refresh automatically on mutations
- Real-time inventory updates across all connected clients
- Optimistic UI updates with rollback on errors

## External Dependencies

### Third-party Services
- **NHTSA API**: Vehicle identification number decoding
- **Google Services**: Future integration for document management
- **AWS S3**: Planned for scalable file storage
- **Stripe**: Payment processing infrastructure (prepared but not active)

### Key Libraries
- **Database**: `@neondatabase/serverless`, `drizzle-orm`
- **UI Components**: `@radix-ui/*` component primitives
- **Validation**: `zod` for schema validation
- **File Processing**: `multer`, `browser-image-compression`
- **Development**: `tsx` for TypeScript execution, `vite` for bundling

## Deployment Strategy

### Development Environment
- **Server**: Hot-reload development server via tsx
- **Client**: Vite dev server with HMR
- **Database**: Shared development database on Neon

### Production Build
- **Frontend**: Static asset generation via Vite
- **Backend**: ESBuild bundling for Node.js deployment
- **Database**: Production PostgreSQL on Neon with connection pooling

### Environment Configuration
- **Database URL**: Required environment variable for PostgreSQL connection
- **API Keys**: Google services and other integrations via environment variables
- **Build Scripts**: Separate development and production workflows

### Scalability Considerations
- **Database**: Serverless PostgreSQL scales automatically
- **File Storage**: Local storage suitable for current scale, cloud migration planned
- **API Design**: Stateless REST endpoints support horizontal scaling
- **Frontend**: Static assets can be served via CDN