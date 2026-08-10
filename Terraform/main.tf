

module "networking" {
  source      = "./modules/networking"
  vpc_cidr    = var.vpc_cidr
  subnet_cidr = var.subnet_cidr
}

module "compute" {
  source            = "./modules/compute"
  subnet_id         = module.networking.subnet_id
  security_group_id = module.networking.security_group_id
  ami_id            =data.aws_ami.server_ami.id
  host_os           = var.host_os
  user_data_path    = "${path.root}/${var.user_data_path}"
  public_key_path   = var.public_key_path
  private_key_path  = var.private_key_path
}