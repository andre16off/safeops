package com.safeops.api.exception;

// Se lanza cuando una operación entra en conflicto con datos existentes (responde 409).
public class ConflictoException extends RuntimeException {

    public ConflictoException(String mensaje) {
        super(mensaje);
    }
}
