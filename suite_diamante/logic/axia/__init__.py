# AXIA - Master Orchestration Namespace
# Este archivo permite la importación consolidada de todos los micro-agentes de AXIA.

from suite_diamante.logic.axia.orchestrator import get_orchestrator
from suite_diamante.logic.axia.brain import get_brain
from suite_diamante.logic.axia.security import get_security
from suite_diamante.logic.axia.hunter import get_hunter
from suite_diamante.logic.axia.finance import get_finance
from suite_diamante.logic.axia.crm import get_crm
from suite_diamante.logic.axia.growth import get_growth
from suite_diamante.logic.axia.executive import get_executive
from suite_diamante.logic.axia.calendar_master import get_calendar
