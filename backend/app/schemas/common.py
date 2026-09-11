"""Common response and pagination schemas."""

from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])


class DbHealthResponse(BaseModel):
    status: str = Field(examples=["connected"])
    database: str = Field(examples=["acadagents"])
    message: str = Field(examples=["PostgreSQL connection healthy"])


class ErrorResponse(BaseModel):
    detail: str = Field(examples=["Requested resource not found"])


class PaginationMetadata(BaseModel):
    total_items: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: PaginationMetadata
