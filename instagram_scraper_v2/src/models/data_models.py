from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class InstagramPost(BaseModel):
    id: str = Field(..., description="Unique ID of the post")
    shortcode: str = Field(..., description="Shortcode from URL")
    url: str
    caption: Optional[str] = None
    timestamp: Optional[datetime] = None
    display_url: Optional[str] = None
    likes_count: Optional[int] = None
    comments_count: Optional[int] = None
    is_video: bool = False
    
    class Config:
        from_attributes = True

class InstagramProfile(BaseModel):
    username: str
    full_name: Optional[str] = None
    biography: Optional[str] = None
    external_url: Optional[str] = None
    followers_count: Optional[int] = None
    following_count: Optional[int] = None
    posts_count: Optional[int] = None
    is_private: bool = False
    is_verified: bool = False
    profile_pic_url: Optional[str] = None
    posts: List[InstagramPost] = []
    scraped_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True
