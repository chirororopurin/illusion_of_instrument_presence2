library(tidyverse)
library(ggplot2)
library(sp)


draw_data <- read.csv(
  "・・・/RQ2_All_Drawing_Points2.csv",
  stringsAsFactors = FALSE
)


colnames(draw_data) <- make.names(colnames(draw_data))

# action type -> action.type
# sound type  -> sound.type


output_dir <- "・・・/Heatmaps_ConvexHull/"
if(!dir.exists(output_dir)) dir.create(output_dir)


conditions <- draw_data %>%
  select(action.type, timing, sound.type) %>%
  distinct()


grid_res <- 50

grid <- expand.grid(
  x = seq(0, 1920, by = grid_res),
  y = seq(0, 1080, by = grid_res)
)


for(i in 1:nrow(conditions)) {

  cond <- conditions[i, ]

  cond_data <- draw_data %>%
    filter(
      action.type == cond$action.type,
      timing == cond$timing,
      sound.type == cond$sound.type
    )

  ids <- unique(cond_data$ID)

  participant_maps <- list()


  for(id in ids){

    id_data <- cond_data %>%
      filter(ID == id)


    if(nrow(id_data) < 3) next


    hull_idx <- chull(id_data$x, id_data$y)

    hull_polygon <- id_data[hull_idx, c("x","y")]


    hull_polygon <- rbind(
      hull_polygon,
      hull_polygon[1,]
    )


    pip <- point.in.polygon(
      point.x = grid$x,
      point.y = grid$y,
      pol.x = hull_polygon$x,
      pol.y = hull_polygon$y
    )

    inside <- ifelse(pip > 0, 1, 0)

    participant_map <- grid %>%
      mutate(value = inside)

    participant_maps[[as.character(id)]] <- participant_map
  }


  all_maps <- bind_rows(
    participant_maps,
    .id = "ID"
  )

  mean_map <- all_maps %>%
    group_by(x, y) %>%
    summarise(
      density = mean(value),
      .groups = "drop"
    )


  p <- ggplot(
    mean_map,
    aes(x = x, y = y, fill = density)
  ) +

    geom_raster(interpolate = TRUE) +

    scale_fill_gradientn(
      colours = c("white", "blue", "red"),
      limits = c(0,1)
    ) +

    coord_fixed(
      xlim = c(0,1920),
      ylim = c(0,1080),
      expand = FALSE
    ) +

    theme_minimal(base_size = 16) +

    labs(
      title = paste(
        "Heatmap:",
        cond$action.type,
        cond$timing,
        cond$sound.type
      ),
      fill = "Overlap Ratio",
      x = "X (pixels)",
      y = "Y (pixels)"
    )

  file_name <- paste0(
    output_dir,
    "Heatmap_",
    cond$action.type, "_",
    cond$timing, "_",
    cond$sound.type,
    "_ConvexHull.png"
  )

  ggsave(
    filename = file_name,
    plot = p,
    width = 1920/100,
    height = 1080/100,
    dpi = 300
  )

  message("Saved: ", file_name)
}

