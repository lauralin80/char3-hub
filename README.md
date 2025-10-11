# Char3 Hub

A project management hub built on top of Trello for software development projects. This tool helps track features, progress, and milestones for client visibility.

## Features

- **Team Collaboration**: Weekly planning board with drag-and-drop functionality
- **Client Deliverables**: Track deliverables and admin tasks across multiple projects
- **Real-time Updates**: Integration with Trello for live data synchronization
- **Notion-style UI**: Clean, modern interface with hover-to-reveal placeholders
- **Project Management**: Track progress across multiple client projects

## Projects Supported

- iLitigate 2.0
- Aurawell
- FFA Phase 2
- Parle
- Roth River
- Quartz Network

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Trello API credentials in `config.py`

3. Run the application:
```bash
python3 website_dashboard.py
```

4. Open your browser to `http://localhost:5001`

## Tech Stack

- **Backend**: Python Flask
- **Frontend**: HTML, CSS, JavaScript
- **API Integration**: Trello API
- **Styling**: Custom CSS with Char3 branding

## Development

The application includes:
- Real-time Trello integration
- Drag-and-drop task management
- Modal forms for adding deliverables and tasks
- Responsive design with dark theme
- Custom field support for structured data

## License

Private project for Char3 development team.