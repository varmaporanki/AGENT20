"""Common response and pagination schemas."""

from typing import Any, Generic, List, Optional, TypeVar
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
    data: List[T] = Field(description="List of records for the requested page")
    pagination: PaginationMetadata = Field(description="Pagination metadata block")
    items: Optional[List[T]] = Field(default=None, description="Direct convenience alias for data")
    page: Optional[int] = Field(default=None, description="Direct convenience alias for current page number")
    page_size: Optional[int] = Field(default=None, description="Direct convenience alias for page size")
    total: Optional[int] = Field(default=None, description="Direct convenience alias for total item count")
    total_pages: Optional[int] = Field(default=None, description="Direct convenience alias for total page count")

    def model_post_init(self, __context: Any) -> None:
        if self.items is None:
            self.items = self.data
        if self.page is None:
            self.page = self.pagination.page
        if self.page_size is None:
            self.page_size = self.pagination.page_size
        if self.total is None:
            self.total = self.pagination.total_items
        if self.total_pages is None:
            self.total_pages = self.pagination.total_pages
