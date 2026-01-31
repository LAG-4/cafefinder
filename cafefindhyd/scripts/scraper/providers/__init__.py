from __future__ import annotations

from .eazydiner import EazydinerParser
from .swiggy_dineout import SwiggyDineoutParser
from .zomato import ZomatoParser


def get_parser(provider_key: str):
    registry = {
        "zomato": ZomatoParser(),
        "swiggy_dineout": SwiggyDineoutParser(),
        "eazydiner": EazydinerParser(),
    }
    return registry.get(provider_key)
