"""add_deadline_to_signals

Revision ID: ccce2400e8b0
Revises: 001
Create Date: 2026-01-30 09:29:29.542508

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ccce2400e8b0'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add deadline column to signals table
    op.add_column('signals', sa.Column('deadline', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove deadline column from signals table
    op.drop_column('signals', 'deadline')
