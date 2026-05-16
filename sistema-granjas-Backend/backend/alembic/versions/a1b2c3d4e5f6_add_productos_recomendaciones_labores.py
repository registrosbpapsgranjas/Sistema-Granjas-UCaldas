"""add productos_recomendaciones and productos_labores

Revision ID: a1b2c3d4e5f6
Revises: 0bb37c3dbf1d
Create Date: 2026-05-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '0bb37c3dbf1d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'productos_recomendaciones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recomendacion_id', sa.Integer(), nullable=False),
        sa.Column('inventario_item_id', sa.Integer(), nullable=True),
        sa.Column('cantidad_sugerida', sa.Float(), nullable=True),
        sa.Column('descripcion', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['inventario_item_id'], ['items_inventario_programa.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['recomendacion_id'], ['recomendaciones.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_productos_recomendaciones_id'), 'productos_recomendaciones', ['id'], unique=False)

    op.create_table(
        'productos_labores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('labor_id', sa.Integer(), nullable=False),
        sa.Column('inventario_item_id', sa.Integer(), nullable=True),
        sa.Column('cantidad_usada', sa.Float(), nullable=True),
        sa.Column('dosis_aplicada', sa.Float(), nullable=True),
        sa.Column('unidad_dosis', sa.String(length=50), nullable=True),
        sa.Column('descripcion', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['inventario_item_id'], ['items_inventario_programa.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['labor_id'], ['labores.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_productos_labores_id'), 'productos_labores', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_productos_labores_id'), table_name='productos_labores')
    op.drop_table('productos_labores')
    op.drop_index(op.f('ix_productos_recomendaciones_id'), table_name='productos_recomendaciones')
    op.drop_table('productos_recomendaciones')
