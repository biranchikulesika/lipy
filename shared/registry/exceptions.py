"""
Custom exceptions used by the LiPy registry.
"""


class RegistryError(Exception):
    """Base exception for all registry errors."""


class RegistryValidationError(RegistryError):
    """Raised when registry validation fails."""