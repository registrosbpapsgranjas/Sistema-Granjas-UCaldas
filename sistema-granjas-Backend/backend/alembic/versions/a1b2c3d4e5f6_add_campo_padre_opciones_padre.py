"""add campo_padre_id and opciones_padre to diagnostico_campos and campos_recomendacion

Revision ID: a1b2c3d4e5f6
Revises: fb55c723c1e2
Create Date: 2026-05-06 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'fb55c723c1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('diagnostico_campos',
        sa.Column('campo_padre_id', sa.Integer(), sa.ForeignKey('diagnostico_campos.id', ondelete='SET NULL'), nullable=True)
    )
    op.add_column('diagnostico_campos',
        sa.Column('opciones_padre', sa.JSON(), nullable=True)
    )
    op.add_column('campos_recomendacion',
        sa.Column('campo_padre_id', sa.Integer(), sa.ForeignKey('campos_recomendacion.id', ondelete='SET NULL'), nullable=True)
    )
    op.add_column('campos_recomendacion',
        sa.Column('opciones_padre', sa.JSON(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('campos_recomendacion', 'opciones_padre')
    op.drop_column('campos_recomendacion', 'campo_padre_id')
    op.drop_column('diagnostico_campos', 'opciones_padre')
    op.drop_column('diagnostico_campos', 'campo_padre_id')
