import json
import os
import sys
from typing import Dict, Any, Optional

try:
    import pythoncom
    import win32com.client
    HAS_WIN32 = True
except ImportError:
    HAS_WIN32 = False

class PowerPointController:
    """
    Controlador de PowerPoint mediante COM Automation (win32com).
    Extrae notas de orador (Speaker Notes), controla diapositivas y
    cuenta con modo de respaldo (fallback/simulación) cuando PowerPoint
    no está abierto o no tiene presentaciones activas.
    """

    def __init__(self, fallback_file_path: Optional[str] = None):
        self.fallback_file = fallback_file_path or os.path.join(
            os.path.dirname(__file__), "script_fallback.json"
        )
        self.mock_data = self._load_fallback()
        self.mock_current_slide = 1
        self.use_mock = False

    def _load_fallback(self) -> Dict[str, Any]:
        """Carga el guion de respaldo en caso de no haber PPT activo."""
        if os.path.exists(self.fallback_file):
            try:
                with open(self.fallback_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[WARN] Error al cargar fallback: {e}")
        return {
            "presentation_title": "Presentación Demo",
            "slides": [
                {
                    "slide_number": 1,
                    "title": "Diapositiva Inicial",
                    "notes": "Bienvenido al Teleprompter del Huawei Watch Fit 3. Conexión lista."
                }
            ]
        }

    def _get_ppt_instance(self):
        """Intenta obtener la instancia activa de PowerPoint vía COM."""
        if not HAS_WIN32:
            return None
        try:
            pythoncom.CoInitialize()
            ppt = win32com.client.GetActiveObject("PowerPoint.Application")
            return ppt
        except Exception:
            return None

    def get_status(self) -> Dict[str, Any]:
        """
        Obtiene el estado actual: presentación activa, número de diapositiva actual,
        total de diapositivas y las notas del orador (Speaker Notes).
        """
        ppt = self._get_ppt_instance()

        if ppt is not None:
            try:
                if ppt.Presentations.Count > 0:
                    presentation = ppt.ActivePresentation
                    total_slides = presentation.Slides.Count

                    # Verificar si está en modo presentación de diapositivas
                    is_slideshow = ppt.SlideShowWindows.Count > 0
                    if is_slideshow:
                        slide_view = ppt.SlideShowWindows(1).View
                        current_slide_idx = slide_view.Slide.SlideIndex
                    else:
                        # Modo normal / edición
                        current_slide_idx = ppt.ActiveWindow.View.Slide.SlideIndex

                    slide = presentation.Slides(current_slide_idx)
                    
                    # Extraer título de la diapositiva
                    title = f"Diapositiva {current_slide_idx}"
                    try:
                        if slide.Shapes.HasTitle:
                            title = slide.Shapes.Title.TextFrame.TextRange.Text.strip()
                    except Exception:
                        pass

                    # Extraer notas del orador (Speaker Notes)
                    notes = self._extract_notes(slide)
                    if not notes or not notes.strip():
                        # Si la diapositiva no tiene notas, buscar si hay en el guion de respaldo
                        notes = self._get_fallback_notes_for_slide(current_slide_idx)

                    return {
                        "mode": "powerpoint_com",
                        "status": "connected",
                        "presentation_title": presentation.Name,
                        "current_slide": current_slide_idx,
                        "total_slides": total_slides,
                        "title": title,
                        "notes": notes,
                        "is_fullscreen": is_slideshow
                    }
            except Exception as e:
                # Si falló la comunicación COM temporalmente, pasar al fallback
                pass

        # Modo Mock / Fallback
        slides = self.mock_data.get("slides", [])
        total_slides = max(len(slides), 1)
        self.mock_current_slide = max(1, min(self.mock_current_slide, total_slides))
        current_data = slides[self.mock_current_slide - 1] if slides else {}

        return {
            "mode": "fallback_simulation",
            "status": "ready (simulación activa - abre PowerPoint para vincular)",
            "presentation_title": self.mock_data.get("presentation_title", "Modo Simulación"),
            "current_slide": self.mock_current_slide,
            "total_slides": total_slides,
            "title": current_data.get("title", f"Diapositiva {self.mock_current_slide}"),
            "notes": current_data.get("notes", "No hay notas para esta diapositiva."),
            "is_fullscreen": False
        }

    def _extract_notes(self, slide) -> str:
        """Extrae el texto de las notas del orador de una diapositiva en PowerPoint."""
        try:
            # En PowerPoint COM, slide.NotesPage contiene las formas de la página de notas
            notes_page = slide.NotesPage
            for shape in notes_page.Shapes:
                if shape.HasTextFrame and shape.TextFrame.HasText:
                    text = shape.TextFrame.TextRange.Text.strip()
                    # El encabezado/pie suele tener solo números o fechas, filtramos el cuerpo principal
                    if text and not text.isdigit():
                        return text
            # Intentar placeholder estándar de notas (índice 2)
            try:
                return notes_page.Shapes.Placeholders(2).TextFrame.TextRange.Text.strip()
            except Exception:
                pass
        except Exception:
            pass
        return ""

    def _get_fallback_notes_for_slide(self, slide_idx: int) -> str:
        """Busca notas en el archivo fallback si la diapositiva de PPT no tiene notas."""
        slides = self.mock_data.get("slides", [])
        if 1 <= slide_idx <= len(slides):
            return slides[slide_idx - 1].get("notes", "")
        return "Sin notas de orador para esta diapositiva."

    def next_slide(self) -> Dict[str, Any]:
        """Avanza a la siguiente diapositiva."""
        ppt = self._get_ppt_instance()
        if ppt is not None:
            try:
                if ppt.SlideShowWindows.Count > 0:
                    ppt.SlideShowWindows(1).View.Next()
                    return self.get_status()
                elif ppt.Presentations.Count > 0:
                    pres = ppt.ActivePresentation
                    curr = ppt.ActiveWindow.View.Slide.SlideIndex
                    if curr < pres.Slides.Count:
                        ppt.ActiveWindow.View.GotoSlide(curr + 1)
                    return self.get_status()
            except Exception:
                pass

        # Fallback
        slides = self.mock_data.get("slides", [])
        if self.mock_current_slide < len(slides):
            self.mock_current_slide += 1
        return self.get_status()

    def prev_slide(self) -> Dict[str, Any]:
        """Retrocede a la diapositiva anterior."""
        ppt = self._get_ppt_instance()
        if ppt is not None:
            try:
                if ppt.SlideShowWindows.Count > 0:
                    ppt.SlideShowWindows(1).View.Previous()
                    return self.get_status()
                elif ppt.Presentations.Count > 0:
                    curr = ppt.ActiveWindow.View.Slide.SlideIndex
                    if curr > 1:
                        ppt.ActiveWindow.View.GotoSlide(curr - 1)
                    return self.get_status()
            except Exception:
                pass

        # Fallback
        if self.mock_current_slide > 1:
            self.mock_current_slide -= 1
        return self.get_status()

    def goto_slide(self, slide_num: int) -> Dict[str, Any]:
        """Salta a un número de diapositiva específico."""
        ppt = self._get_ppt_instance()
        if ppt is not None:
            try:
                if ppt.SlideShowWindows.Count > 0:
                    ppt.SlideShowWindows(1).View.GotoSlide(slide_num)
                    return self.get_status()
                elif ppt.Presentations.Count > 0:
                    ppt.ActiveWindow.View.GotoSlide(slide_num)
                    return self.get_status()
            except Exception:
                pass

        # Fallback
        slides = self.mock_data.get("slides", [])
        if 1 <= slide_num <= len(slides):
            self.mock_current_slide = slide_num
        return self.get_status()

    def start_presentation(self) -> Dict[str, Any]:
        """Inicia la presentación en pantalla completa."""
        ppt = self._get_ppt_instance()
        if ppt is not None:
            try:
                if ppt.Presentations.Count > 0:
                    ppt.ActivePresentation.SlideShowSettings.Run()
                    return self.get_status()
            except Exception:
                pass
        return self.get_status()

    def exit_presentation(self) -> Dict[str, Any]:
        """Sale del modo pantalla completa."""
        ppt = self._get_ppt_instance()
        if ppt is not None:
            try:
                if ppt.SlideShowWindows.Count > 0:
                    ppt.SlideShowWindows(1).View.Exit()
                    return self.get_status()
            except Exception:
                pass
        return self.get_status()
