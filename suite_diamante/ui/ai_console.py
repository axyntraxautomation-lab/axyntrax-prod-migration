import os
import sys
from colorama import init, Fore, Style

# Añadir el path del proyecto
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from suite_diamante.logic.ai_guide import get_diamond_ai
from suite_diamante.logic.axia.brain import get_brain

init(autoreset=True)

def main():
    ai = get_diamond_ai()
    axia = get_brain()
    
    print(Fore.CYAN + Style.BRIGHT + "=== AXYNTRAX: CONSOLA DE INTELIGENCIA AXIA ===")
    print(Fore.WHITE + "Escriba su consulta (+51986663866 autorizado)")
    print(Fore.WHITE + "Escriba 'salir' para finalizar.\n")

    # Saludo inicial humanizado
    print(Fore.MAGENTA + "AXIA > " + Fore.WHITE + axia.greet(is_owner=True) + "\n")

    while True:
        try:
            query = input(Fore.YELLOW + "Miguel > " + Fore.WHITE).strip()
            
            if query.lower() in ["salir", "exit", "quit"]:
                print(Fore.CYAN + f"\n[IA] Desconectando AXIA. Hasta pronto, {axia.owner_name}.")
                break
            
            if not query:
                continue

            print(Fore.MAGENTA + "\n[AXIA Pensando...]")
            response = ai.ask(query)
            
            print(Fore.GREEN + "\nAXIA > " + Fore.WHITE + response + "\n")
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(Fore.RED + f"\n[ERROR] {e}")

if __name__ == "__main__":
    main()
