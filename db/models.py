from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone

Base = declarative_base()


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True)
    name_ja = Column(String, nullable=False, unique=True)

    prefectures = relationship("Prefecture", back_populates="region")


class Prefecture(Base):
    __tablename__ = "prefectures"

    id = Column(Integer, primary_key=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    name_ja = Column(String, nullable=False, unique=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)

    region = relationship("Region", back_populates="prefectures")
    areas = relationship("Area", back_populates="prefecture")


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True)
    prefecture_id = Column(Integer, ForeignKey("prefectures.id"), nullable=False)
    name_ja = Column(String, nullable=False, unique=True)

    prefecture = relationship("Prefecture", back_populates="areas")
    snapshots = relationship("Snapshot", back_populates="area")
    subscriptions = relationship("Subscription", back_populates="area")


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    vacant_rooms = Column(Integer, nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    area = relationship("Area", back_populates="snapshots")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    area = relationship("Area", back_populates="subscriptions")