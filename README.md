# Mantra - IT Support Ticket Management System

A comprehensive IT support ticket management system built with React, TypeScript, and Supabase. This application provides a complete solution for managing support tickets, user roles, team assignments, and knowledge base articles.

## 🚀 Features

- **Ticket Management**: Create, assign, update, and track support tickets
- **Role-Based Access Control**: Different permissions for users, leads, and admins
- **Team Management**: Organize users into teams with proper assignments
- **Knowledge Base**: Create and manage articles to help resolve common issues
- **Real-time Updates**: Live notifications and status updates
- **Reporting & Analytics**: Comprehensive reports and charts for ticket metrics
- **SLA Tracking**: Monitor and manage service level agreements
- **File Attachments**: Support for file uploads on tickets
- **Audit Logging**: Complete audit trail for all ticket activities

## 📋 Prerequisites

Before setting up the project locally, ensure you have the following installed:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

### Recommended Installation Method for Node.js

We recommend using **nvm** (Node Version Manager) to install and manage Node.js versions:

```bash
# Install nvm (Linux/macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18
```

## 🛠️ Local Installation

### Step 1: Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

The project is pre-configured with Supabase environment variables. The `.env` file contains:

```env
VITE_SUPABASE_PROJECT_ID="srmqbjrsrtkbiyhvideh"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://srmqbjrsrtkbiyhvideh.supabase.co"
```

> **Note**: These are demo credentials. For production use, you'll need to set up your own Supabase project.

### Step 4: Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 🗄️ Database Schema

The application uses the following main tables:

### Core Tables
- **users**: User profiles with roles and team assignments
- **roles**: System roles (user, lead, admin)
- **teams**: Organizational teams
- **tickets**: Support ticket records
- **categories**: Ticket categorization
- **urgency_levels**: Priority levels with SLA definitions

### Supporting Tables
- **ticket_comments**: Comments on tickets
- **ticket_attachments**: File uploads
- **ticket_audit_log**: Activity tracking
- **ticket_kb_links**: Knowledge base article links
- **knowledgebase_articles**: Help documentation
- **ticket_counters**: Auto-incrementing ticket IDs

## 👥 User Roles & Permissions

### User Roles
1. **User**: Can create and view own tickets
2. **Lead**: Can view and manage team tickets
3. **Admin**: Full system access

### Default Demo Data
The system includes sample data for demonstration:
- Users across different roles
- Sample tickets in various statuses
- Knowledge base articles
- Team structures

## 🎯 Getting Started with Demo

### Creating Your First Ticket
1. Navigate to `/create-ticket`
2. Fill in the ticket details
3. Select category and urgency
4. Submit the ticket

### Exploring Features
1. **Dashboard** (`/`): Overview of ticket metrics
2. **View Tickets** (`/view-tickets`): List and filter tickets
3. **Team Management** (`/team-management`): Manage users and assignments
4. **Reports** (`/reports`): Analytics and reporting
5. **Knowledge Base**: Browse help articles

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── reports/        # Reporting components
├── contexts/           # React contexts (Auth, ViewMode)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/      # Supabase client and types
├── lib/               # Utility functions
├── pages/             # Page components
└── utils/             # Helper functions
```

## 🎨 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage)
- **State Management**: React Query, Context API
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## 🚀 Deployment Options

### Option 1: Lovable Platform (Recommended)
1. Visit [Lovable Project](https://lovable.dev/projects/b0f2aa72-c648-465b-9097-639a7ed92647)
2. Click on "Share" → "Publish"
3. Your app will be deployed automatically

### Option 2: Manual Deployment
The project can be deployed to any static hosting service:

```bash
# Build the project
npm run build

# Deploy the 'dist' folder to your hosting service
```

Popular hosting options:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

## 🔒 Security Features

- Row Level Security (RLS) policies on all database tables
- JWT-based authentication via Supabase
- Role-based access control
- Secure file upload handling
- Audit logging for compliance

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `vite.config.ts`
2. **Database connection issues**: Verify Supabase credentials
3. **Build failures**: Check for TypeScript errors
4. **Authentication issues**: Clear browser storage and retry

### Getting Help

1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure Node.js version is 18 or higher
4. Review the [Lovable documentation](https://docs.lovable.dev/)

## 📞 Support

For issues related to:
- **Code editing**: Use [Lovable](https://lovable.dev/projects/b0f2aa72-c648-465b-9097-639a7ed92647)
- **Deployment**: Check [Lovable docs](https://docs.lovable.dev/)
- **Custom domains**: [Domain setup guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 📄 License

This project is created with Lovable and follows their terms of service.

---

**Built with ❤️ using [Lovable](https://lovable.dev)**