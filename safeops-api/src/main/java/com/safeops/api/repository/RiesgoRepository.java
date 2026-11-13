
package com.safeops.api.repository;

import com.safeops.api.model.Riesgo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RiesgoRepository extends JpaRepository<Riesgo, Long> {

    // para consultar riesgos de un área específica
    List<Riesgo> findByAreaId(Long areaId);

    // para verificar si un área tiene riesgos antes de eliminarla
    boolean existsByAreaId(Long areaId);

    // para consulta JPQL para filtrar riesgos por su nivel
    @Query("SELECT r FROM Riesgo r WHERE r.nivel = :nivel")
    List<Riesgo> buscarPorNivel(@Param("nivel") String nivel);

    // para consulta JPQL para encontrar riesgos con impacto igual o superior al indicado
    @Query("SELECT r FROM Riesgo r WHERE r.impacto >= :impactoMinimo")
    List<Riesgo> buscarPorImpactoMinimo(
            @Param("impactoMinimo") Integer impactoMinimo);
}
