"""
Custom Exception Classes for RecallGuard
"""


class RecallGuardException(Exception):
    """Base exception for RecallGuard errors."""
    pass


class ArmorIQSecurityException(RecallGuardException):
    """Raised when an action violates ArmorIQ intent governance policies."""
    def __init__(self, message: str, action: str, details: dict = None):
        super().__init__(message)
        self.action = action
        self.details = details or {}


class InventoryNotFoundException(RecallGuardException):
    """Raised when an inventory lot or shipment cannot be found."""
    pass


class DatabaseOperationException(RecallGuardException):
    """Raised when a database transaction fails."""
    pass
