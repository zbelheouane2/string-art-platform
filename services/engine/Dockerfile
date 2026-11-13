FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY pyproject.toml ./
COPY stringart ./stringart
COPY boards ./boards
RUN pip install --no-cache-dir -e ".[api]" && useradd --system --uid 10001 engine
USER engine
EXPOSE 8000
CMD ["uvicorn", "stringart.api:app", "--host", "0.0.0.0", "--port", "8000"]
