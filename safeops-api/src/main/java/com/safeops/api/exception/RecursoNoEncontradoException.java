package com.safeops.api.exception;

// Se lanza cuando un área o riesgo solicitado no existe (responde 404).
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
