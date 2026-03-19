"""add_signal_action_fields

Revision ID: 1a70240be7aa
Revises: 38f019826947
Create Date: 2026-01-30 11:43:22.703193

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a70240be7aa'
down_revision: Union[str, None] = '38f019826947'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add action tracking fields to signals table
    op.add_column('signals', sa.Column('action_type', sa.String(length=100), nullable=True))
    op.add_column('signals', sa.Column('action_data', sa.Text(), nullable=True))
    op.add_column('signals', sa.Column('action_notes', sa.Text(), nullable=True))
    op.add_column('signals', sa.Column('action_taken_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove action tracking fields
    op.drop_column('signals', 'action_taken_at')
    op.drop_column('signals', 'action_notes')
    op.drop_column('signals', 'action_data')
    op.drop_column('signals', 'action_type')
