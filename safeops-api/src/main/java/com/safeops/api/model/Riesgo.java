package com.safeops.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "riesgos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Riesgo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El peligro es obligatorio")
    @Column(nullable = false)
    private String peligro;

    @NotBlank(message = "La descripción es obligatoria")
    @Column(nullable = false)
    private String descripcion;

    @NotNull(message = "La probabilidad es obligatoria")
    @Min(value = 1, message = "La probabilidad debe ser mínimo 1")
    @Max(value = 5, message = "La probabilidad debe ser máximo 5")
    private Integer probabilidad;

    @NotNull(message = "El impacto es obligatorio")
    @Min(value = 1, message = "El impacto debe ser mínimo 1")
    @Max(value = 5, message = "El impacto debe ser máximo 5")
    private Integer impacto;

    private String nivel;

    @ManyToOne
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;
}