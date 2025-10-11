#!/usr/bin/env python3
"""
Char3 Hub App Concept
A unified system that eliminates team friction while providing full visibility
"""

from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import json
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

app = Flask(__name__)

# Data models
@dataclass
class Task:
    id: str
    title: str
    description: str
    board: str  # 'design', 'ux', 'dev', 'account'
    project: str  # 'iLitigate', 'RothRiver', 'ParentMD'
    assignee: str
    effort: int  # 1-5
    milestone: str
    status: str  # 'backlog', 'in_progress', 'complete'
    created_date: str
    due_date: Optional[str] = None
    tags: List[str] = None

@dataclass
class Deliverable:
    id: str
    title: str
    description: str
    client: str
    project: str
    agreed_date: str
    due_date: str
    status: str  # 'pending', 'in_progress', 'delivered'
    notes: List[str] = None

@dataclass
class Milestone:
    id: str
    title: str
    project: str
    start_date: str
    end_date: str
    progress: float  # 0-100
    tasks: List[str] = None  # Task IDs

@dataclass
class Project:
    id: str
    name: str
    client: str
    start_date: str
    end_date: str
    progress: float  # 0-100
    milestones: List[str] = None  # Milestone IDs

# Sample data
sample_tasks = [
    Task("1", "User Authentication System", "Build login/logout functionality", "dev", "iLitigate", "Developer", 3, "M1", "backlog", "2024-01-01"),
    Task("2", "Dashboard Components", "Create reusable dashboard components", "design", "iLitigate", "Designer", 2, "M1", "in_progress", "2024-01-01"),
    Task("3", "UX Flow Analysis", "Review user workflow gaps", "ux", "iLitigate", "UX", 2, "M1", "backlog", "2024-01-01"),
    Task("4", "Client Demo Prep", "Prepare demo for client meeting", "account", "iLitigate", "Project Lead", 1, "M1", "pending", "2024-01-01"),
]

sample_deliverables = [
    Deliverable("1", "User Authentication Demo", "Show login/logout functionality", "Client A", "iLitigate", "2024-01-15", "2024-02-01", "pending", ["Client wants SSO integration"]),
    Deliverable("2", "Dashboard Prototype", "Interactive dashboard mockup", "Client A", "iLitigate", "2024-01-20", "2024-02-15", "pending", ["Focus on mobile responsiveness"]),
]

sample_milestones = [
    Milestone("1", "Core Authentication", "iLitigate", "2024-01-01", "2024-02-01", 25.0, ["1", "3"]),
    Milestone("2", "Dashboard Features", "iLitigate", "2024-02-01", "2024-03-01", 0.0, ["2"]),
]

sample_projects = [
    Project("1", "iLitigate 2.0", "Client A", "2024-01-01", "2024-06-01", 12.5, ["1", "2"]),
]

# In-memory storage (replace with database in production)
tasks = {task.id: task for task in sample_tasks}
deliverables = {deliverable.id: deliverable for deliverable in sample_deliverables}
milestones = {milestone.id: milestone for milestone in sample_milestones}
projects = {project.id: project for project in sample_projects}

@app.route('/')
def dashboard():
    """Main dashboard"""
    return render_template('dashboard.html')

@app.route('/api/tasks')
def get_tasks():
    """Get all tasks with optional filtering"""
    board_filter = request.args.get('board')
    project_filter = request.args.get('project')
    assignee_filter = request.args.get('assignee')
    
    filtered_tasks = list(tasks.values())
    
    if board_filter:
        filtered_tasks = [t for t in filtered_tasks if t.board == board_filter]
    if project_filter:
        filtered_tasks = [t for t in filtered_tasks if t.project == project_filter]
    if assignee_filter:
        filtered_tasks = [t for t in filtered_tasks if t.assignee == assignee_filter]
    
    return jsonify([asdict(task) for task in filtered_tasks])

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    data = request.json
    task_id = str(len(tasks) + 1)
    
    new_task = Task(
        id=task_id,
        title=data['title'],
        description=data['description'],
        board=data['board'],
        project=data['project'],
        assignee=data['assignee'],
        effort=data['effort'],
        milestone=data['milestone'],
        status='backlog',
        created_date=datetime.now().isoformat(),
        due_date=data.get('due_date'),
        tags=data.get('tags', [])
    )
    
    tasks[task_id] = new_task
    return jsonify(asdict(new_task)), 201

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    if task_id not in tasks:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.json
    task = tasks[task_id]
    
    # Update fields
    for field, value in data.items():
        if hasattr(task, field):
            setattr(task, field, value)
    
    return jsonify(asdict(task))

@app.route('/api/deliverables')
def get_deliverables():
    """Get all deliverables"""
    return jsonify([asdict(d) for d in deliverables.values()])

@app.route('/api/deliverables', methods=['POST'])
def create_deliverable():
    """Create a new deliverable"""
    data = request.json
    deliverable_id = str(len(deliverables) + 1)
    
    new_deliverable = Deliverable(
        id=deliverable_id,
        title=data['title'],
        description=data['description'],
        client=data['client'],
        project=data['project'],
        agreed_date=data['agreed_date'],
        due_date=data['due_date'],
        status='pending',
        notes=data.get('notes', [])
    )
    
    deliverables[deliverable_id] = new_deliverable
    return jsonify(asdict(new_deliverable)), 201

@app.route('/api/milestones')
def get_milestones():
    """Get all milestones"""
    return jsonify([asdict(m) for m in milestones.values()])

@app.route('/api/projects')
def get_projects():
    """Get all projects with progress"""
    return jsonify([asdict(p) for p in projects.values()])

@app.route('/api/project-timeline/<project_id>')
def get_project_timeline(project_id):
    """Get project timeline with milestones and progress"""
    if project_id not in projects:
        return jsonify({'error': 'Project not found'}), 404
    
    project = projects[project_id]
    project_milestones = [milestones[mid] for mid in project.milestones if mid in milestones]
    
    # Calculate progress based on milestone completion
    total_progress = sum(m.progress for m in project_milestones) / len(project_milestones) if project_milestones else 0
    
    timeline = {
        'project': asdict(project),
        'milestones': [asdict(m) for m in project_milestones],
        'overall_progress': total_progress,
        'forecasted_completion': calculate_forecasted_completion(project, project_milestones)
    }
    
    return jsonify(timeline)

@app.route('/api/weekly-planner')
def get_weekly_planner():
    """Get weekly planner data"""
    # Get tasks assigned to this week
    week_start = request.args.get('week_start', datetime.now().strftime('%Y-%m-%d'))
    
    # For now, return all tasks (in real app, filter by week)
    return jsonify([asdict(task) for task in tasks.values()])

def calculate_forecasted_completion(project, milestones):
    """Calculate forecasted project completion date"""
    if not milestones:
        return project.end_date
    
    # Simple calculation based on current progress
    current_progress = sum(m.progress for m in milestones) / len(milestones)
    if current_progress == 0:
        return project.end_date
    
    # Estimate based on current pace
    days_elapsed = (datetime.now() - datetime.fromisoformat(project.start_date)).days
    if days_elapsed > 0:
        daily_progress = current_progress / days_elapsed
        remaining_progress = 100 - current_progress
        days_remaining = remaining_progress / daily_progress if daily_progress > 0 else 0
        
        forecast_date = datetime.now() + timedelta(days=days_remaining)
        return forecast_date.isoformat()
    
    return project.end_date

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='127.0.0.1')
