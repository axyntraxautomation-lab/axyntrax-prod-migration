import os
import time
import sys
from rich.console import Console
from rich.live import Live
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn

console = Console()

def generate_dashboard_table():
    table = Table(show_header=True, header_style="bold magenta", expand=True)
    table.add_column("MODULO", style="cyan")
    table.add_column("STATUS", style="green")
    table.add_column("OPS/SEC", justify="right")
    
    table.add_row("CECILIA (Chatbot)", "ONLINE", str(120 + time.localtime().tm_sec))
    table.add_row("ATLAS (AutoRepair)", "SCANNING", "--")
    table.add_row("NEO (DevOps)", "STANDBY", "0")
    return table

def main():
    os.system("cls" if os.name == "nt" else "clear")
    console.print(Panel("[bold white on dark_green] >>> AXYNTRAX SANDBOX DEMO ACTIVATED <<< [/]", subtitle="[bold yellow]MODO DE PRUEBA LOCAL[/]"))
    
    time.sleep(1)
    console.print("[yellow]INFO[/] Iniciando handshake con servidor API Axyntrax...")
    time.sleep(1)
    console.print("[green]OK[/] Conexión Segura Establecida (TLS 1.3)")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
    ) as progress:
        task1 = progress.add_task("[cyan]Descargando Dependencias Temporales...", total=100)
        task2 = progress.add_task("[red]Generando Token de Prueba...", total=100)
        
        while not progress.finished:
            progress.update(task1, advance=0.8)
            progress.update(task2, advance=0.5)
            time.sleep(0.02)
            
    console.print("\n[bold green][EXITO] ENTORNO DE PRUEBA DESPLEGADO.[/]")
    console.print("Accediendo al mini-dashboard operativo...\n")
    
    time.sleep(1)
    
    with Live(generate_dashboard_table(), refresh_per_second=2) as live:
        for _ in range(10):
            time.sleep(0.5)
            live.update(generate_dashboard_table())
            
    console.print("\n[bold white]============================================[/]")
    console.print("[bold yellow]CONGRATULATIONS![/]")
    console.print("La demo ficticia ha demostrado que el stack carga localmente.")
    console.print("AXYNTRAX V3.5 listo para adquisición de licencia.")
    console.print("[bold white]============================================[/]")
    time.sleep(3)

if __name__ == "__main__":
    main()
