"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2026-01-29 10:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('role', sa.Enum('admin', 'handler', 'viewer', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create cases table
    op.create_table(
        'cases',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_number', sa.String(length=50), nullable=False),
        sa.Column('claim_number', sa.String(length=50), nullable=True),
        sa.Column('policy_number', sa.String(length=50), nullable=True),
        sa.Column('status', sa.Enum('new', 'in_progress', 'pending_review', 'approved', 'rejected', 'closed', name='casestatus'), nullable=False),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', 'critical', name='priority'), nullable=False),
        sa.Column('sla_risk', sa.Enum('none', 'low', 'medium', 'high', name='slarisk'), nullable=False),
        sa.Column('incident_date', sa.Date(), nullable=True),
        sa.Column('report_date', sa.Date(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('closed_date', sa.Date(), nullable=True),
        sa.Column('assigned_to_id', sa.Integer(), nullable=True),
        sa.Column('claimant_name', sa.String(length=255), nullable=True),
        sa.Column('claimant_contact', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('subcategory', sa.String(length=100), nullable=True),
        sa.Column('claim_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('estimated_reserve', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('external_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cases_case_number'), 'cases', ['case_number'], unique=True)
    op.create_index(op.f('ix_cases_claim_number'), 'cases', ['claim_number'], unique=False)
    op.create_index(op.f('ix_cases_external_id'), 'cases', ['external_id'], unique=False)
    op.create_index(op.f('ix_cases_id'), 'cases', ['id'], unique=False)
    op.create_index(op.f('ix_cases_policy_number'), 'cases', ['policy_number'], unique=False)
    op.create_index(op.f('ix_cases_priority'), 'cases', ['priority'], unique=False)
    op.create_index(op.f('ix_cases_sla_risk'), 'cases', ['sla_risk'], unique=False)
    op.create_index(op.f('ix_cases_status'), 'cases', ['status'], unique=False)

    # Create signals table
    op.create_table(
        'signals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.Enum('communications', 'tasks', 'data_quality', 'financial', 'process', name='signalcategory'), nullable=False),
        sa.Column('severity', sa.Enum('info', 'warning', 'error', 'critical', name='signalseverity'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by_id', sa.Integer(), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=True),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resolved_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_signals_case_id'), 'signals', ['case_id'], unique=False)
    op.create_index(op.f('ix_signals_category'), 'signals', ['category'], unique=False)
    op.create_index(op.f('ix_signals_id'), 'signals', ['id'], unique=False)
    op.create_index(op.f('ix_signals_severity'), 'signals', ['severity'], unique=False)

    # Create timeline table
    op.create_table(
        'timeline',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.Enum('case_created', 'status_changed', 'assignment_changed', 'note_added', 'document_uploaded', 'signal_generated', 'contact_made', 'payment_made', 'other', name='timelineeventtype'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_by_name', sa.String(length=255), nullable=True),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_timeline_case_id'), 'timeline', ['case_id'], unique=False)
    op.create_index(op.f('ix_timeline_created_at'), 'timeline', ['created_at'], unique=False)
    op.create_index(op.f('ix_timeline_id'), 'timeline', ['id'], unique=False)

    # Create logging table
    op.create_table(
        'logging',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('username', sa.String(length=100), nullable=True),
        sa.Column('action', sa.Enum('create', 'update', 'delete', 'login', 'logout', 'import_data', 'export_data', name='actiontype'), nullable=False),
        sa.Column('entity_type', sa.Enum('case', 'signal', 'user', 'behandelplan', 'reserve', 'timeline', 'system', name='entitytype'), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('summary', sa.String(length=500), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('request_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_logging_action'), 'logging', ['action'], unique=False)
    op.create_index(op.f('ix_logging_created_at'), 'logging', ['created_at'], unique=False)
    op.create_index(op.f('ix_logging_entity_id'), 'logging', ['entity_id'], unique=False)
    op.create_index(op.f('ix_logging_entity_type'), 'logging', ['entity_type'], unique=False)
    op.create_index(op.f('ix_logging_id'), 'logging', ['id'], unique=False)
    op.create_index(op.f('ix_logging_request_id'), 'logging', ['request_id'], unique=False)
    op.create_index(op.f('ix_logging_user_id'), 'logging', ['user_id'], unique=False)

    # Create behandelplan table
    op.create_table(
        'behandelplan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('treatment_plan', sa.Text(), nullable=True),
        sa.Column('expected_duration_days', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('expected_end_date', sa.Date(), nullable=True),
        sa.Column('actual_end_date', sa.Date(), nullable=True),
        sa.Column('provider_name', sa.String(length=255), nullable=True),
        sa.Column('provider_contact', sa.String(length=255), nullable=True),
        sa.Column('provider_specialty', sa.String(length=100), nullable=True),
        sa.Column('is_approved', sa.Boolean(), nullable=True),
        sa.Column('approved_date', sa.Date(), nullable=True),
        sa.Column('approved_by_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_behandelplan_case_id'), 'behandelplan', ['case_id'], unique=True)
    op.create_index(op.f('ix_behandelplan_id'), 'behandelplan', ['id'], unique=False)

    # Create reserves table
    op.create_table(
        'reserves',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('reserve_type', sa.Enum('initial', 'revision', 'final', name='reservetype'), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_by_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reserves_case_id'), 'reserves', ['case_id'], unique=False)
    op.create_index(op.f('ix_reserves_created_at'), 'reserves', ['created_at'], unique=False)
    op.create_index(op.f('ix_reserves_id'), 'reserves', ['id'], unique=False)

    # Create comparable_cases table
    op.create_table(
        'comparable_cases',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('reference_case_number', sa.String(length=50), nullable=True),
        sa.Column('reference_case_id', sa.Integer(), nullable=True),
        sa.Column('similarity_score', sa.Float(), nullable=True),
        sa.Column('similarity_factors', sa.Text(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('outcome', sa.String(length=100), nullable=True),
        sa.Column('settlement_amount', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reference_case_id'], ['cases.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comparable_cases_case_id'), 'comparable_cases', ['case_id'], unique=False)
    op.create_index(op.f('ix_comparable_cases_id'), 'comparable_cases', ['id'], unique=False)
    op.create_index(op.f('ix_comparable_cases_reference_case_number'), 'comparable_cases', ['reference_case_number'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_comparable_cases_reference_case_number'), table_name='comparable_cases')
    op.drop_index(op.f('ix_comparable_cases_id'), table_name='comparable_cases')
    op.drop_index(op.f('ix_comparable_cases_case_id'), table_name='comparable_cases')
    op.drop_table('comparable_cases')
    
    op.drop_index(op.f('ix_reserves_id'), table_name='reserves')
    op.drop_index(op.f('ix_reserves_created_at'), table_name='reserves')
    op.drop_index(op.f('ix_reserves_case_id'), table_name='reserves')
    op.drop_table('reserves')
    
    op.drop_index(op.f('ix_behandelplan_id'), table_name='behandelplan')
    op.drop_index(op.f('ix_behandelplan_case_id'), table_name='behandelplan')
    op.drop_table('behandelplan')
    
    op.drop_index(op.f('ix_logging_user_id'), table_name='logging')
    op.drop_index(op.f('ix_logging_request_id'), table_name='logging')
    op.drop_index(op.f('ix_logging_id'), table_name='logging')
    op.drop_index(op.f('ix_logging_entity_type'), table_name='logging')
    op.drop_index(op.f('ix_logging_entity_id'), table_name='logging')
    op.drop_index(op.f('ix_logging_created_at'), table_name='logging')
    op.drop_index(op.f('ix_logging_action'), table_name='logging')
    op.drop_table('logging')
    
    op.drop_index(op.f('ix_timeline_id'), table_name='timeline')
    op.drop_index(op.f('ix_timeline_created_at'), table_name='timeline')
    op.drop_index(op.f('ix_timeline_case_id'), table_name='timeline')
    op.drop_table('timeline')
    
    op.drop_index(op.f('ix_signals_severity'), table_name='signals')
    op.drop_index(op.f('ix_signals_id'), table_name='signals')
    op.drop_index(op.f('ix_signals_category'), table_name='signals')
    op.drop_index(op.f('ix_signals_case_id'), table_name='signals')
    op.drop_table('signals')
    
    op.drop_index(op.f('ix_cases_status'), table_name='cases')
    op.drop_index(op.f('ix_cases_sla_risk'), table_name='cases')
    op.drop_index(op.f('ix_cases_priority'), table_name='cases')
    op.drop_index(op.f('ix_cases_policy_number'), table_name='cases')
    op.drop_index(op.f('ix_cases_id'), table_name='cases')
    op.drop_index(op.f('ix_cases_external_id'), table_name='cases')
    op.drop_index(op.f('ix_cases_claim_number'), table_name='cases')
    op.drop_index(op.f('ix_cases_case_number'), table_name='cases')
    op.drop_table('cases')
    
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
